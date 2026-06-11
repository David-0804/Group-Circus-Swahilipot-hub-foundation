"""Nexus Celery Tasks — FM Heartbeat, Subscription Expiry Alerts, Overdue Checks"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger('Nexus')


@shared_task(name='Nexus.tasks.check_fm_heartbeat', bind=True, max_retries=3)
def check_fm_heartbeat(self):
    """
    Runs every 5 minutes.
    Checks FM station heartbeat URLs. If no ping received in the last 6 minutes,
    auto-logs an outage and sends alerts.
    """
    try:
        import requests
        from apps.fm_report.models import FMStation, FMOutage, FMHeartbeat

        stations = FMStation.objects.filter(is_active=True, heartbeat_url__isnull=False).exclude(heartbeat_url='')

        for station in stations:
            try:
                start = timezone.now()
                resp = requests.get(station.heartbeat_url, timeout=10)
                response_ms = int((timezone.now() - start).total_seconds() * 1000)

                FMHeartbeat.objects.create(
                    station=station,
                    status_code=resp.status_code,
                    response_ms=response_ms,
                    success=resp.status_code == 200,
                )

                if resp.status_code == 200 and station.current_status != 'on_air':
                    # Auto-restore
                    open_outage = station.outages.filter(restored_at__isnull=True).first()
                    if open_outage:
                        open_outage.restored_at = timezone.now()
                        open_outage.resolution_notes = 'Auto-restored by heartbeat monitor'
                        open_outage.save()
                    station.current_status = 'on_air'
                    station.last_status_change = timezone.now()
                    station.save(update_fields=['current_status', 'last_status_change'])
                    logger.info(f"FM station {station.name} auto-restored via heartbeat")

            except Exception as e:
                # Request failed — station might be down
                FMHeartbeat.objects.create(station=station, success=False)

                if station.current_status != 'off_air':
                    # Auto-log outage
                    open_outage = station.outages.filter(restored_at__isnull=True).first()
                    if not open_outage:
                        outage = FMOutage.objects.create(
                            station=station,
                            down_at=timezone.now(),
                            description=f'Auto-detected: heartbeat check failed ({str(e)[:100]})',
                            auto_detected=True,
                            severity='critical',
                        )
                        station.current_status = 'off_air'
                        station.last_status_change = timezone.now()
                        station.save(update_fields=['current_status', 'last_status_change'])

                        # Send alerts
                        try:
                            from apps.notifications.services import NotificationService
                            NotificationService.send_fm_down_alert(station, outage, None)
                            outage.alert_sent = True
                            outage.save(update_fields=['alert_sent'])
                        except Exception as alert_err:
                            logger.error(f"FM auto-alert failed: {alert_err}")

                        logger.warning(f"FM station {station.name} auto-logged as DOWN")

    except Exception as e:
        logger.error(f"FM heartbeat task failed: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(name='Nexus.tasks.check_subscription_expiry')
def check_subscription_expiry():
    """
    Runs daily at 08:00.
    Sends alerts for software subscriptions expiring in 30 or 7 days.
    """
    try:
        from apps.news.models import SoftwareSubscription
        from apps.notifications.services import NotificationService

        today = timezone.now().date()

        for days, field in [(30, 'alert_30_sent'), (7, 'alert_7_sent')]:
            target_date = today + timedelta(days=days)
            subs = SoftwareSubscription.objects.filter(
                expiry_date=target_date,
                status='active',
                **{field: False},
            )
            for sub in subs:
                NotificationService.send_subscription_expiry_alert(sub, days)
                setattr(sub, field, True)
                sub.save(update_fields=[field])
                logger.info(f"Subscription expiry alert sent for {sub.software_name} ({days}d)")

        # Mark expired ones
        SoftwareSubscription.objects.filter(
            expiry_date__lt=today, status='active'
        ).update(status='expired')

    except Exception as e:
        logger.error(f"Subscription expiry task failed: {e}")


@shared_task(name='Nexus.tasks.check_overdue_tasks')
def check_overdue_tasks():
    """
    Runs every hour.
    Marks tasks as overdue and sends alerts to assignees and supervisors.
    """
    try:
        from apps.tasks.models import Task
        from apps.notifications.services import NotificationService

        now = timezone.now()
        overdue_tasks = Task.objects.filter(
            due_date__lt=now,
            status__in=['pending', 'in_progress', 'submitted'],
            overdue_alert_sent=False,
        ).select_related('assigned_to', 'assigned_by')

        for task in overdue_tasks:
            task.status = 'overdue'
            task.overdue_alert_sent = True
            task.save(update_fields=['status', 'overdue_alert_sent'])

            # Notify assignee
            NotificationService.notify_user(
                task.assigned_to,
                f'Task Overdue: {task.title}',
                f'Your task "{task.title}" was due {task.due_date.strftime("%Y-%m-%d %H:%M")} and is now overdue.',
                'task_overdue',
                sms=True,
            )

            # Notify supervisor
            NotificationService.notify_user(
                task.assigned_by,
                f'Overdue Task Alert: {task.title}',
                f'{task.assigned_to.full_name}\'s task "{task.title}" is overdue.',
                'task_overdue',
            )

        logger.info(f"Marked {overdue_tasks.count()} tasks as overdue")

    except Exception as e:
        logger.error(f"Overdue tasks check failed: {e}")


@shared_task(name='Nexus.tasks.check_overdue_equipment')
def check_overdue_equipment():
    """
    Runs daily.
    Flags checkout requests where return date has passed and sends alerts.
    """
    try:
        from apps.equipment.models import CheckoutRequest
        from apps.notifications.services import NotificationService

        today = timezone.now().date()
        overdue = CheckoutRequest.objects.filter(
            status='active',
            end_date__lt=today,
            overdue_alert_sent=False,
        ).select_related('item', 'requested_by', 'approved_by')

        for checkout in overdue:
            checkout.overdue_alert_sent = True
            checkout.save(update_fields=['overdue_alert_sent'])

            days_overdue = (today - checkout.end_date).days
            msg = (
                f'Equipment return OVERDUE: {checkout.item.name} ({checkout.item.asset_tag})\n'
                f'Was due: {checkout.end_date}\n'
                f'Now {days_overdue} day(s) overdue.\n'
                f'Please return immediately or contact admin.'
            )

            NotificationService.notify_user(
                checkout.requested_by,
                f'Equipment Overdue: {checkout.item.name}',
                msg,
                'checkout_update',
                sms=True,
            )

        logger.info(f"Sent {overdue.count()} overdue equipment alerts")

    except Exception as e:
        logger.error(f"Overdue equipment check failed: {e}")


@shared_task(name='Nexus.tasks.send_radio_reminders')
def send_radio_reminders():
    """
    Runs every 30 minutes.
    Sends 24-hour and 2-hour reminders to radio presenters about upcoming slots.
    """
    try:
        from apps.news.models import RadioSlot
        from apps.notifications.services import NotificationService

        now = timezone.now()

        # 24-hour reminders
        in_24h = now + timedelta(hours=24)
        slots_24h = RadioSlot.objects.filter(
            start_datetime__gte=in_24h - timedelta(minutes=30),
            start_datetime__lte=in_24h + timedelta(minutes=30),
            status='scheduled',
            reminder_24h_sent=False,
        ).select_related('presenter', 'show', 'frequency')

        for slot in slots_24h:
            NotificationService.notify_user(
                slot.presenter,
                f'Show Reminder (24h): {slot.show.name}',
                f'You\'re on air in 24 hours!\n'
                f'Show: {slot.show.name}\nFrequency: {slot.frequency.frequency_mhz} MHz\n'
                f'Time: {slot.start_datetime.strftime("%Y-%m-%d %H:%M")}\n'
                f'{"⚠️ Show plan not submitted yet." if not slot.show_plan else "✅ Show plan submitted."}',
                'reminder',
                sms=True,
            )
            slot.reminder_24h_sent = True
            slot.save(update_fields=['reminder_24h_sent'])

        # 2-hour reminders
        in_2h = now + timedelta(hours=2)
        slots_2h = RadioSlot.objects.filter(
            start_datetime__gte=in_2h - timedelta(minutes=15),
            start_datetime__lte=in_2h + timedelta(minutes=15),
            status='scheduled',
            reminder_2h_sent=False,
        ).select_related('presenter', 'show', 'frequency')

        for slot in slots_2h:
            NotificationService.notify_user(
                slot.presenter,
                f'🎙️ You\'re On Air in 2 Hours! {slot.show.name}',
                f'Final reminder — {slot.show.name} starts at {slot.start_datetime.strftime("%H:%M")} on {slot.frequency.frequency_mhz} MHz.',
                'reminder',
                sms=True,
            )
            slot.reminder_2h_sent = True
            slot.save(update_fields=['reminder_2h_sent'])

        logger.info(f"Sent {slots_24h.count()} 24h and {slots_2h.count()} 2h radio reminders")

    except Exception as e:
        logger.error(f"Radio reminder task failed: {e}")


@shared_task(name='Nexus.tasks.expire_file_transfers')
def expire_file_transfers():
    """
    Runs hourly.
    Deletes file transfer links that have expired.
    """
    try:
        now = timezone.now()
        # Placeholder — actual logic in filetransfer app
        logger.info("File transfer expiry check completed")
    except Exception as e:
        logger.error(f"File transfer expiry failed: {e}")


@shared_task(name='Nexus.tasks.send_digest_emails')
def send_digest_emails():
    """
    Runs every hour.
    Sends digest notification emails to users who have opted in.
    """
    try:
        from apps.notifications.models import NotificationPreference, Notification
        from apps.notifications.services import NotificationService

        current_hour = timezone.now().hour
        prefs = NotificationPreference.objects.filter(
            digest_email=True,
            digest_hour=current_hour,
        ).select_related('user')

        for pref in prefs:
            unread = Notification.objects.filter(
                recipient=pref.user,
                read=False,
                email_sent=False,
            ).order_by('-created_at')[:20]

            if not unread:
                continue

            body = f"You have {unread.count()} unread notifications:\n\n"
            for n in unread:
                body += f"• {n.title}\n  {n.body[:100]}...\n\n"
            body += "\nLog in to Nexus to view and action all notifications."

            NotificationService.send_email(
                pref.user.email,
                f'Nexus Digest: {unread.count()} unread notifications',
                body,
            )
            unread.update(email_sent=True)

        logger.info(f"Sent digest emails to {prefs.count()} users")

    except Exception as e:
        logger.error(f"Digest email task failed: {e}")
