"""Nexus Radio — URL Configuration"""
from django.urls import path
<<<<<<< HEAD
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)
User = get_user_model()
=======
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
>>>>>>> origin/main


class RadioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'active', 'results': []})

    def post(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'created'}, status=201)

    def patch(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'updated'})

    def delete(self, request, **kwargs):
        return Response(status=204)


<<<<<<< HEAD
# ---------------------------------------------------------------------------
# Helper: build a Google Calendar "Add to Calendar" URL from slot data.
# ---------------------------------------------------------------------------
def _google_calendar_url(slot_data: dict) -> str:
    """
    Returns a pre-filled Google Calendar event creation URL.
    Dates must be ISO-8601 strings in UTC (e.g. "2025-06-15T08:00:00Z").
    """
    from urllib.parse import urlencode, quote
    from datetime import datetime

    def _fmt(iso: str) -> str:
        """Convert ISO-8601 → Google's YYYYMMDDTHHmmssZ compact format."""
        try:
            dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
            return dt.strftime("%Y%m%dT%H%M%SZ")
        except Exception:
            return ""

    params = {
        "action": "TEMPLATE",
        "text": slot_data.get("show_name", "Radio Slot"),
        "dates": f"{_fmt(slot_data.get('start_datetime',''))}/{_fmt(slot_data.get('end_datetime',''))}",
        "details": slot_data.get("description", ""),
        "location": slot_data.get("location", ""),
    }
    base = "https://calendar.google.com/calendar/render"
    return f"{base}?{urlencode(params)}"


# ---------------------------------------------------------------------------
# POST /radio/notify/
# Body: { slot: <slot-object>, presenter_user_id: <uuid-str>, action: "created"|"updated" }
# Looks up the presenter's email and sends a confirmation email with a
# Google Calendar link embedded in it.
# ---------------------------------------------------------------------------
class SlotNotifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, **kwargs):
        slot = request.data.get("slot", {})
        presenter_user_id = request.data.get("presenter_user_id")
        action = request.data.get("action", "created")  # "created" | "updated" | "cancelled"

        if not presenter_user_id or not slot:
            return Response({"error": "slot and presenter_user_id are required."}, status=400)

        # ── Resolve presenter email ────────────────────────────────────────
        try:
            presenter = User.objects.get(pk=presenter_user_id)
            email = presenter.email
        except User.DoesNotExist:
            return Response({"error": "Presenter user not found."}, status=404)

        if not email:
            return Response({"error": "Presenter has no email on record."}, status=422)

        # ── Build Google Calendar URL ──────────────────────────────────────
        gcal_url = _google_calendar_url(slot)

        # ── Compose email ─────────────────────────────────────────────────
        show_name   = slot.get("show_name", "Your slot")
        start_dt    = slot.get("start_datetime", "")
        end_dt      = slot.get("end_datetime", "")
        frequency   = slot.get("frequency_name", "")
        location    = slot.get("location", "")

        # Determine tone/content based on action
        if action == "cancelled":
            verb = "cancelled"
            subject_tag = "⚠️ Slot Cancelled"
            header_icon = "🚫"
            header_color = "#ef4444"
        elif action == "updated":
            verb = "updated"
            subject_tag = "Slot Updated"
            header_icon = "✏️"
            header_color = "#f59e0b"
        else:
            verb = "created"
            subject_tag = "Slot Confirmed"
            header_icon = "✅"
            header_color = "#22c55e"

        subject = f"[Nexus Radio] {subject_tag}: {show_name}"

        # Conditional CTA block
        if action == "cancelled":
            cta_block = (
                '<div style="background:#450a0a;border:1px solid #ef4444;border-radius:8px;'
                'padding:14px 18px;margin-bottom:16px;">'
                '<p style="color:#fca5a5;margin:0;font-size:14px;font-weight:600;">'
                '⚠️ This slot has been cancelled and removed from the schedule.</p>'
                '<p style="color:#f87171;margin:8px 0 0;font-size:13px;">'
                'Please contact your broadcast administrator for further information.</p>'
                '</div>'
            )
        else:
            cta_block = (
                f'<a href="{gcal_url}" ' +
                'style="display:inline-block;background:#3b63f5;color:#fff;padding:10px 22px;' +
                'border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;' +
                'margin-bottom:12px;">' +
                '📅 Add to Google Calendar</a>'
            )

        html_body = f"""
<html><body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:auto;">
  <div style="background:#1e2538;padding:24px 28px;border-radius:12px;">
    <h2 style="color:{header_color};margin:0 0 4px;">{header_icon} {subject_tag}: {show_name}</h2>
    <p style="color:#94a3b8;margin:0 0 20px;font-size:14px;">Nexus Broadcast Management</p>

    <div style="background:#0f172a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#64748b;padding:4px 0;width:110px;">Show</td>
            <td style="color:#f1f5f9;font-weight:600;">{show_name}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0;">Start</td>
            <td style="color:#f1f5f9;">{start_dt}</td></tr>
        <tr><td style="color:#64748b;padding:4px 0;">End</td>
            <td style="color:#f1f5f9;">{end_dt}</td></tr>
        {'<tr><td style="color:#64748b;padding:4px 0;">Frequency</td><td style="color:#f1f5f9;">' + frequency + '</td></tr>' if frequency else ''}
        {'<tr><td style="color:#64748b;padding:4px 0;">Location</td><td style="color:#f1f5f9;">' + location + '</td></tr>' if location else ''}
      </table>
    </div>

    {cta_block}

    <p style="color:#475569;font-size:12px;margin-top:20px;">
      You received this email because you are the assigned presenter for this slot
      on Nexus Radio.{"" if action == "cancelled" else " You will receive an in-app reminder 60 and 15 minutes before air-time."}
    </p>
  </div>
</body></html>
"""

        if action == "cancelled":
            plain_body = (
                f"SLOT CANCELLED: {show_name}\n"
                f"Original time: {start_dt} — {end_dt}\n"
                f"Frequency: {frequency}\nLocation: {location}\n"
                "\nThis slot has been removed from the schedule. "
                "Please contact your broadcast administrator."
            )
        else:
            plain_body = (
                f"Radio slot {verb}: {show_name}\n"
                f"Start: {start_dt}\nEnd: {end_dt}\n"
                f"Frequency: {frequency}\nLocation: {location}\n\n"
                f"Add to Google Calendar:\n{gcal_url}"
            )

        try:
            send_mail(
                subject=subject,
                message=plain_body,
                html_message=html_body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@nexus.local"),
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info("Slot [%s] notification email (%s) sent to %s", slot.get("id"), action, email)
        except Exception as exc:
            logger.exception("Failed to send slot notification email: %s", exc)
            return Response({"error": "Email delivery failed.", "detail": str(exc)}, status=500)

        return Response({"sent_to": email, "gcal_url": gcal_url})


# ---------------------------------------------------------------------------
# GET /radio/upcoming-reminders/
# Returns slots for the authenticated user that start within the next 60 min
# and have not yet been dismissed.  The frontend polls this every ~60 s and
# pops a toast / browser notification when results are returned.
#
# NOTE: This stub queries the RadioSlot model.  Adjust the import path to
#       match your actual model location, e.g.:
#         from apps.radio.models import RadioSlot
# ---------------------------------------------------------------------------
class UpcomingRemindersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        """
        Return slots assigned to the current user that start in the next
        `window` minutes (default 60, max 1440).
        """
        try:
            window_minutes = min(int(request.query_params.get("window", 60)), 1440)
        except (ValueError, TypeError):
            window_minutes = 60

        now    = timezone.now()
        cutoff = now + timedelta(minutes=window_minutes)

        try:
            # ── Replace with your actual model import ─────────────────────
            from apps.radio.models import RadioSlot  # noqa: PLC0415

            slots = RadioSlot.objects.filter(
                presenter=request.user,
                start_datetime__gt=now,
                start_datetime__lte=cutoff,
                status__in=["scheduled"],
            ).values(
                "id", "show_name", "start_datetime", "end_datetime",
                "frequency_name", "location",
            )

            results = []
            for s in slots:
                minutes_away = int((s["start_datetime"] - now).total_seconds() / 60)
                results.append({
                    **{k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in s.items()},
                    "minutes_away": minutes_away,
                    "gcal_url": _google_calendar_url({
                        "show_name":      s["show_name"],
                        "start_datetime": s["start_datetime"].isoformat(),
                        "end_datetime":   s["end_datetime"].isoformat(),
                        "location":       s.get("location", ""),
                    }),
                })

            return Response({"results": results})

        except ImportError:
            # Model not yet available (e.g. during early dev) — return empty
            logger.warning("apps.radio.models.RadioSlot not importable; returning empty reminders.")
            return Response({"results": []})
        except Exception as exc:
            logger.exception("Reminder query failed: %s", exc)
            return Response({"error": str(exc)}, status=500)


urlpatterns = [
    path("",                          RadioView.as_view(),            name="radio-list"),
    path("schedule/",                 RadioView.as_view(),            name="radio-schedule"),
    path("schedule/<uuid:pk>/",       RadioView.as_view(),            name="radio-slot-detail"),
    path("frequencies/",              RadioView.as_view(),            name="radio-frequencies"),
    path("shows/",                    RadioView.as_view(),            name="radio-shows"),
    path("my-schedule/",              RadioView.as_view(),            name="radio-my-schedule"),
    path("notify/",                   SlotNotifyView.as_view(),       name="radio-notify"),
    path("upcoming-reminders/",       UpcomingRemindersView.as_view(),name="radio-upcoming-reminders"),
    path("<uuid:pk>/",                RadioView.as_view(),            name="radio-detail"),
]

# =============================================================================
# FRONTEND INTEGRATION NOTE — add these stubs to services/api.ts
# =============================================================================
# The RadioPage relies on two new endpoints. Add them to your radioApi object:
#
#   // Trigger email alert + get gcal_url back
#   notifySlot: (payload: {
#     slot: any;
#     presenter_user_id: string;
#     action: "created" | "updated" | "cancelled";
#   }) => axios.post("/api/radio/notify/", payload),
#
#   // Poll for slots starting within `window` minutes for the current user
#   upcomingReminders: (window = 65) =>
#     axios.get("/api/radio/upcoming-reminders/", { params: { window } }),
#
# EMAIL BACKEND SETUP (settings.py):
#   EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
#   EMAIL_HOST = "smtp.your-provider.com"
#   EMAIL_PORT = 587
#   EMAIL_USE_TLS = True
#   EMAIL_HOST_USER = "noreply@yourdomain.com"
#   EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
#   DEFAULT_FROM_EMAIL = "Nexus Radio <noreply@yourdomain.com>"
#
# For dev/testing, swap to the console backend:
#   EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
# =============================================================================
=======
urlpatterns = [
    path('',                      RadioView.as_view(), name='radio-list'),
    path('schedule/',             RadioView.as_view(), name='radio-schedule'),
    path('schedule/<uuid:pk>/',   RadioView.as_view(), name='radio-slot-detail'),
    path('frequencies/',          RadioView.as_view(), name='radio-frequencies'),
    path('shows/',                RadioView.as_view(), name='radio-shows'),
    path('my-schedule/',          RadioView.as_view(), name='radio-my-schedule'),
    path('<uuid:pk>/',            RadioView.as_view(), name='radio-detail'),
]
>>>>>>> origin/main
