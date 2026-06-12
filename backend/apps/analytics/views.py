"""Nexus Analytics — Cross-module dashboard data and KPI generation"""
from django.db.models import Count, Avg, Sum, Q, F
from django.utils import timezone
from datetime import timedelta, date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, serializers
from django.http import HttpResponse
import csv, io


class AnalyticsDashboardView(APIView):
    """Main analytics dashboard — aggregates data from all modules"""

    def get(self, request):
        org = request.user.organisation
        today = timezone.now().date()
        last_14 = today - timedelta(days=14)
        last_30 = today - timedelta(days=30)

        data = {
            'stats': self._get_stats(org, today),
            'charts': {
                'attendance_trend':  self._attendance_trend(org, last_14, today),
                'task_status':       self._task_status(org),
                'equipment_by_cat':  self._equipment_by_category(org),
                'fm_uptime_30d':     self._fm_uptime_trend(org, last_30, today),
                'news_by_status':    self._news_by_status(org),
                'top_departments':   self._top_departments(org),
            },
        }
        return Response(data)

    def _get_stats(self, org, today):
        from apps.accounts.models import User
        from apps.attendance.models import AttendanceRecord
        from apps.tasks.models import Task

        stats = {}

        # Users
        users = User.objects.filter(organisation=org, is_active=True)
        stats['active_users']    = users.count()
        stats['active_attachees']= users.filter(role='attachee').count()

        # Attendance
        att = AttendanceRecord.objects.filter(user__organisation=org, date=today)
        stats['present_today']   = att.filter(status='present').count()
        stats['on_leave_today']  = att.filter(status='leave').count()
        stats['late_today']      = att.filter(status='late').count()

        # Tasks
        tasks = Task.objects.filter(organisation=org)
        stats['tasks_total']          = tasks.count()
        stats['tasks_overdue']        = tasks.filter(status='overdue').count()
        stats['tasks_completed_today']= tasks.filter(
            status='approved', reviewed_at__date=today
        ).count()
        stats['tasks_pending']        = tasks.filter(status='pending').count()

        # Equipment
        try:
            from apps.equipment.models import EquipmentItem, CheckoutRequest
            stats['equipment_on_loan']  = EquipmentItem.objects.filter(
                organisation=org, status='checked_out'
            ).count()
            stats['equipment_overdue']  = CheckoutRequest.objects.filter(
                item__organisation=org, status='active', end_date__lt=today
            ).count()
        except Exception:
            stats['equipment_on_loan'] = 0
            stats['equipment_overdue'] = 0

        # FM
        try:
            from apps.fm_report.models import FMStation, FMOutage
            stations = FMStation.objects.filter(organisation=org)
            stats['fm_active_outages'] = stations.filter(current_status='off_air').count()
            stats['fm_uptime_percent'] = round(
                sum(s.total_uptime_today for s in stations) /
                max(len(stations) * (timezone.now().hour * 60 + timezone.now().minute), 1) * 100, 1
            ) if stations else 100.0
        except Exception:
            stats['fm_active_outages'] = 0
            stats['fm_uptime_percent'] = 100.0

        # Broadcast
        try:
            from apps.news.models import NewsStory, SoftwareSubscription
            stats['open_tickets']              = 0  # from feedback module
            stats['subscriptions_expiring_7d'] = SoftwareSubscription.objects.filter(
                organisation=org, expiry_date__lte=today + timedelta(days=7),
                expiry_date__gte=today, status='active'
            ).count()
            stats['news_published_today'] = NewsStory.objects.filter(
                organisation=org, status='published',
                published_at__date=today
            ).count()
            stats['projects_pending_review'] = NewsStory.objects.filter(
                organisation=org, status='submitted'
            ).count()
        except Exception:
            stats['subscriptions_expiring_7d'] = 0
            stats['news_published_today'] = 0
            stats['projects_pending_review'] = 0

        # Wi-Fi
        stats['wifi_active_grants'] = 0  # populated from wifi module

        return stats

    def _attendance_trend(self, org, start, end):
        from apps.attendance.models import AttendanceRecord
        from datetime import timedelta
        results = []
        current = start
        while current <= end:
            day_data = AttendanceRecord.objects.filter(
                user__organisation=org, date=current
            ).aggregate(
                present=Count('id', filter=Q(status__in=['present', 'late'])),
                absent=Count('id', filter=Q(status='absent')),
                leave=Count('id', filter=Q(status='leave')),
            )
            results.append({
                'date': current.strftime('%m/%d'),
                **day_data
            })
            current += timedelta(days=1)
        return results

    def _task_status(self, org):
        from apps.tasks.models import Task
        statuses = Task.objects.filter(organisation=org).values('status').annotate(count=Count('id'))
        label_map = {
            'pending': 'Pending', 'in_progress': 'In Progress',
            'submitted': 'Submitted', 'approved': 'Approved',
            'rejected': 'Rejected', 'overdue': 'Overdue',
        }
        return [{'name': label_map.get(s['status'], s['status']), 'value': s['count']} for s in statuses]

    def _equipment_by_category(self, org):
        try:
            from apps.equipment.models import EquipmentItem
            cats = EquipmentItem.objects.filter(
                organisation=org, is_active=True
            ).values('category__name').annotate(count=Count('id'))
            return [{'name': c['category__name'] or 'Uncategorised', 'value': c['count']} for c in cats]
        except Exception:
            return []

    def _fm_uptime_trend(self, org, start, end):
        try:
            from apps.fm_report.models import FMOutage, FMStation
            from datetime import timedelta
            results = []
            current = start
            stations = FMStation.objects.filter(organisation=org)
            while current <= end:
                day_start = timezone.make_aware(timezone.datetime(current.year, current.month, current.day))
                day_end   = day_start + timedelta(days=1)
                outage_mins = FMOutage.objects.filter(
                    station__in=stations,
                    down_at__gte=day_start,
                    down_at__lt=day_end,
                ).aggregate(total=Sum('duration_minutes'))['total'] or 0
                uptime = max(0, round((1440 - outage_mins) / 1440 * 100, 1))
                results.append({'date': current.strftime('%m/%d'), 'uptime': uptime})
                current += timedelta(days=1)
            return results
        except Exception:
            return []

    def _news_by_status(self, org):
        try:
            from apps.news.models import NewsStory
            statuses = NewsStory.objects.filter(organisation=org).values('status').annotate(count=Count('id'))
            return [{'name': s['status'], 'value': s['count']} for s in statuses]
        except Exception:
            return []

    def _top_departments(self, org):
        from apps.accounts.models import Department, User
        dept_data = []
        for dept in Department.objects.filter(organisation=org)[:10]:
            count = User.objects.filter(department=dept, is_active=True).count()
            dept_data.append({'name': dept.name, 'users': count})
        return sorted(dept_data, key=lambda x: x['users'], reverse=True)[:8]


class AdminDashboardOverviewView(APIView):
    """Admin dashboard cross-module overview"""

    def get(self, request):
        org = request.user.organisation
        today = timezone.now().date()

        # Build alert feed
        alerts = self._build_alerts(org, today)

        # Recent activity from audit log
        from core.models import AuditLog
        activity = AuditLog.objects.filter(
            user__organisation=org
        ).select_related('user').order_by('-created_at')[:20]

        activity_data = [{
            'user_name': a.user.full_name if a.user else 'System',
            'action': a.action.lower(),
            'resource': a.resource_type.replace('_', ' '),
            'timestamp': a.created_at.isoformat(),
        } for a in activity]

        # Re-use analytics for stats
        analytics_view = AnalyticsDashboardView()
        analytics_view.request = request
        stats_response = analytics_view._get_stats(org, today)

        return Response({
            'stats': stats_response,
            'alerts': alerts,
            'activity': activity_data,
            'charts': {
                'attendance_trend': analytics_view._attendance_trend(
                    org, today - timedelta(days=14), today
                ),
                'task_status': analytics_view._task_status(org),
            }
        })

    def _build_alerts(self, org, today):
        alerts = []
        try:
            from apps.equipment.models import CheckoutRequest
            overdue = CheckoutRequest.objects.filter(
                item__organisation=org, status='active', end_date__lt=today
            ).count()
            if overdue:
                alerts.append({
                    'type': 'overdue_equipment',
                    'message': f'{overdue} equipment item{"s" if overdue > 1 else ""} overdue for return',
                    'link': '/equipment',
                })
        except Exception: pass

        try:
            from apps.news.models import SoftwareSubscription
            from datetime import timedelta
            expiring = SoftwareSubscription.objects.filter(
                organisation=org,
                expiry_date__lte=today + timedelta(days=7),
                expiry_date__gte=today,
                status='active'
            ).count()
            if expiring:
                alerts.append({
                    'type': 'licence_expiring',
                    'message': f'{expiring} software licence{"s" if expiring > 1 else ""} expiring within 7 days',
                    'link': '/subscriptions',
                })
        except Exception: pass

        try:
            from apps.fm_report.models import FMStation
            down = FMStation.objects.filter(organisation=org, current_status='off_air').count()
            if down:
                alerts.append({
                    'type': 'fm_outage',
                    'message': f'{down} FM station{"s" if down > 1 else ""} currently OFF AIR',
                    'link': '/fm-report',
                })
        except Exception: pass

        return alerts


class AttendanceAnalyticsView(APIView):
    def get(self, request):
        from apps.attendance.models import AttendanceRecord
        org = request.user.organisation
        period_days = int(request.query_params.get('days', 30))
        start = timezone.now().date() - timedelta(days=period_days)

        records = AttendanceRecord.objects.filter(
            user__organisation=org, date__gte=start
        )
        return Response({
            'total_records': records.count(),
            'present': records.filter(status='present').count(),
            'late': records.filter(status='late').count(),
            'absent': records.filter(status='absent').count(),
            'on_leave': records.filter(status='leave').count(),
            'avg_hours': records.filter(
                total_hours__isnull=False
            ).aggregate(avg=Avg('total_hours'))['avg'],
            'by_method': list(
                records.values('method').annotate(count=Count('id'))
            ),
        })


class ExportView(APIView):
    """Export any module data as CSV"""

    def get(self, request, module):
        org = request.user.organisation
        today = timezone.now().date()
        start = request.query_params.get('start')
        end   = request.query_params.get('end')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{module}-export-{today}.csv"'
        writer = csv.writer(response)

        if module == 'attendance':
            from apps.attendance.models import AttendanceRecord
            writer.writerow(['Date', 'User', 'Department', 'Check-In', 'Check-Out', 'Total Hours', 'Status', 'Method'])
            qs = AttendanceRecord.objects.filter(user__organisation=org).select_related('user', 'user__department')
            if start: qs = qs.filter(date__gte=start)
            if end:   qs = qs.filter(date__lte=end)
            for r in qs.order_by('-date'):
                writer.writerow([
                    r.date, r.user.full_name,
                    r.user.department.name if r.user.department else '',
                    r.check_in_time.strftime('%H:%M:%S') if r.check_in_time else '',
                    r.check_out_time.strftime('%H:%M:%S') if r.check_out_time else '',
                    r.total_hours or '', r.status, r.method,
                ])

        elif module == 'fm-outages':
            from apps.fm_report.models import FMOutage
            writer.writerow(['Station', 'Down At', 'Restored At', 'Duration (min)', 'Severity', 'Reported By', 'Description'])
            qs = FMOutage.objects.filter(station__organisation=org).select_related('station', 'reported_by')
            if start: qs = qs.filter(down_at__date__gte=start)
            if end:   qs = qs.filter(down_at__date__lte=end)
            for o in qs.order_by('-down_at'):
                writer.writerow([
                    o.station.name,
                    o.down_at.strftime('%Y-%m-%d %H:%M:%S'),
                    o.restored_at.strftime('%Y-%m-%d %H:%M:%S') if o.restored_at else 'Ongoing',
                    o.duration_minutes or '',
                    o.severity,
                    o.reported_by.full_name if o.reported_by else 'Auto',
                    o.description,
                ])

        elif module == 'equipment':
            from apps.equipment.models import EquipmentItem
            writer.writerow(['Asset Tag', 'Name', 'Category', 'Make', 'Model', 'Status', 'Condition', 'Location', 'Purchase Date', 'Cost'])
            qs = EquipmentItem.objects.filter(organisation=org, is_active=True).select_related('category')
            for item in qs.order_by('category__name', 'name'):
                writer.writerow([
                    item.asset_tag, item.name,
                    item.category.name if item.category else '',
                    item.make, item.model, item.status, item.condition,
                    item.location,
                    item.purchase_date or '', item.purchase_cost or '',
                ])

        else:
            writer.writerow(['Module not found'])

        return response

