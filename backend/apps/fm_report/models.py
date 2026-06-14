"""Nexus FM Station Report — Critical Broadcast Module"""
import uuid
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.models import TimeStampedModel
from apps.notifications.services import NotificationService


# ─── MODELS ──────────────────────────────────────────────────────────────────

class FMStation(TimeStampedModel):
    """FM Station definition"""
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='fm_stations')
    name = models.CharField(max_length=200)
    frequency = models.CharField(max_length=20)
    heartbeat_url = models.URLField(blank=True, help_text='URL to ping for automatic status checking')
    is_active = models.BooleanField(default=True)
    alert_emails = models.TextField(blank=True, help_text='Comma-separated emails for alerts')
    alert_phones = models.TextField(blank=True)
    current_status = models.CharField(max_length=20, choices=[
        ('on_air', 'On Air'), ('off_air', 'Off Air'), ('unknown', 'Unknown'),
    ], default='unknown')
    last_status_change = models.DateTimeField(null=True, blank=True)
    total_uptime_today = models.IntegerField(default=0, help_text='Minutes on air today')

    def __str__(self):
        return f"{self.name} ({self.frequency})"

    def get_alert_emails(self):
        return [e.strip() for e in self.alert_emails.split(',') if e.strip()]

    def get_alert_phones(self):
        return [p.strip() for p in self.alert_phones.split(',') if p.strip()]


class FMOutage(TimeStampedModel):
    """Individual FM outage record"""
    station = models.ForeignKey(FMStation, on_delete=models.CASCADE, related_name='outages')
    reported_by = models.ForeignKey('accounts.User', null=True, on_delete=models.SET_NULL, related_name='fm_outages_reported')
    down_at = models.DateTimeField()
    restored_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    auto_detected = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='fm_outages_resolved')
    severity = models.CharField(max_length=20, choices=[
        ('minor', 'Minor'), ('moderate', 'Moderate'), ('critical', 'Critical'),
    ], default='moderate')
    alert_sent = models.BooleanField(default=False)

    class Meta:  # type: ignore
        ordering = ['-down_at']

    def __str__(self):
        return f"{self.station.name} outage at {self.down_at}"

    def calculate_duration(self):
        if self.restored_at and self.down_at:
            delta = self.restored_at - self.down_at
            return int(delta.total_seconds() / 60)
        return None

    def save(self, *args, **kwargs):
        if self.restored_at and not self.duration_minutes:
            self.duration_minutes = self.calculate_duration()
        super().save(*args, **kwargs)


class FMHeartbeat(TimeStampedModel):
    """Log of heartbeat pings — used for automated monitoring"""
    station = models.ForeignKey(FMStation, on_delete=models.CASCADE, related_name='heartbeats')
    received_at = models.DateTimeField(auto_now_add=True)
    status_code = models.IntegerField(null=True, blank=True)
    response_ms = models.IntegerField(null=True, blank=True)
    success = models.BooleanField(default=True)

    class Meta:  # type: ignore
        ordering = ['-received_at']


class EmergencyAlert(TimeStampedModel):
    """System-wide emergency alert — triggered by the 'SEND ALERT' button"""
    TYPES = [
        ('system_down', 'System Down'),
        ('fm_outage', 'FM Station Outage'),
        ('security_breach', 'Security Breach'),
        ('infrastructure', 'Infrastructure Failure'),
        ('emergency', 'General Emergency'),
        ('data_breach', 'Data Breach'),
        ('fire', 'Fire / Evacuation'),
        ('other', 'Other'),
    ]
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='emergency_alerts')
    triggered_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='triggered_alerts')
    alert_type = models.CharField(max_length=50, choices=TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical'),
    ], default='high')
    affected_systems = models.JSONField(default=list)
    notified_emails = models.JSONField(default=list)
    notified_phones = models.JSONField(default=list)
    acknowledged_by = models.ManyToManyField('accounts.User', blank=True, related_name='acknowledged_alerts')
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:  # type: ignore
        ordering = ['-created_at']


# ─── SERIALIZERS ────────────────────────────────────────────────────────────

class FMStationSerializer(serializers.ModelSerializer):
    uptime_percent_today = serializers.SerializerMethodField()
    active_outage = serializers.SerializerMethodField()
    time_since_change = serializers.SerializerMethodField()

    class Meta:  # type: ignore
        model = FMStation
        fields = '__all__'

    def get_uptime_percent_today(self, obj):
        total_minutes = timezone.now().hour * 60 + timezone.now().minute
        if total_minutes == 0:
            return 100.0
        return round((obj.total_uptime_today / total_minutes) * 100, 1)

    def get_active_outage(self, obj):
        outage = obj.outages.filter(restored_at__isnull=True).first()
        if outage:
            return {'id': str(outage.id), 'down_at': outage.down_at, 'description': outage.description}
        return None

    def get_time_since_change(self, obj):
        if obj.last_status_change:
            delta = timezone.now() - obj.last_status_change
            minutes = int(delta.total_seconds() / 60)
            hours, mins = divmod(minutes, 60)
            if hours > 0:
                return f"{hours}h {mins}m"
            return f"{mins}m"
        return None


class FMOutageSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)

    class Meta:  # type: ignore
        model = FMOutage
        fields = '__all__'
        read_only_fields = ['duration_minutes', 'auto_detected', 'alert_sent']


class EmergencyAlertSerializer(serializers.ModelSerializer):
    triggered_by_name = serializers.CharField(source='triggered_by.full_name', read_only=True)
    acknowledged_count = serializers.SerializerMethodField()

    class Meta:  # type: ignore
        model = EmergencyAlert
        fields = '__all__'
        read_only_fields = ['notified_emails', 'notified_phones']
        read_only_fields = [
            'organisation',
            'triggered_by',
            'notified_emails',
            'notified_phones',
            'acknowledged_by',
        ]


    def get_acknowledged_count(self, obj):
        return obj.acknowledged_by.count()


# ─── VIEWS ───────────────────────────────────────────────────────────────────

class FMStationListView(generics.ListCreateAPIView):
    serializer_class = FMStationSerializer

    def get_queryset(self):
        return FMStation.objects.filter(organisation=self.request.user.organisation)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class FMStationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FMStationSerializer

    def get_queryset(self):
        return FMStation.objects.filter(organisation=self.request.user.organisation)


class ReportFMDownView(APIView):
    """Mark FM station as off-air and send alerts"""

    def post(self, request, station_id):
        try:
            station = FMStation.objects.get(id=station_id, organisation=request.user.organisation)
        except FMStation.DoesNotExist:
            return Response({'detail': 'Station not found'}, status=404)

        # Close any existing open outage
        existing = station.outages.filter(restored_at__isnull=True).first()
        if existing:
            return Response({'detail': 'Station already reported as down', 'outage_id': str(existing.id)}, status=400)

        description = request.data.get('description', '')
        severity = request.data.get('severity', 'moderate')

        outage = FMOutage.objects.create(
            station=station,
            reported_by=request.user,
            down_at=timezone.now(),
            description=description,
            severity=severity,
        )

        station.current_status = 'off_air'
        station.last_status_change = timezone.now()
        station.save(update_fields=['current_status', 'last_status_change'])

        # Send alerts
        try:
            NotificationService.send_fm_down_alert(station, outage, request.user)
            outage.alert_sent = True
            outage.save(update_fields=['alert_sent'])
        except Exception as e:
            pass  # Don't fail the report if notifications fail

        return Response(FMOutageSerializer(outage).data, status=201)


class ReportFMRestoredView(APIView):
    """Mark FM station as back on air"""

    def post(self, request, station_id):
        try:
            station = FMStation.objects.get(id=station_id, organisation=request.user.organisation)
        except FMStation.DoesNotExist:
            return Response({'detail': 'Station not found'}, status=404)

        outage = station.outages.filter(restored_at__isnull=True).first()
        if not outage:
            return Response({'detail': 'No active outage found'}, status=400)

        resolution_notes = request.data.get('resolution_notes', '')
        outage.restored_at = timezone.now()
        outage.resolved_by = request.user
        outage.resolution_notes = resolution_notes
        outage.save()

        station.current_status = 'on_air'
        station.last_status_change = timezone.now()
        station.save(update_fields=['current_status', 'last_status_change'])

        try:
            NotificationService.send_fm_restored_alert(station, outage)
        except Exception:
            pass

        return Response(FMOutageSerializer(outage).data)


class FMOutageHistoryView(generics.ListAPIView):
    serializer_class = FMOutageSerializer

    def get_queryset(self):
        station_id = self.kwargs.get('station_id')
        qs = FMOutage.objects.filter(station__organisation=self.request.user.organisation)
        if station_id:
            qs = qs.filter(station_id=station_id)
        return qs.select_related('station', 'reported_by', 'resolved_by')


class EmergencyAlertView(APIView):
    """Trigger a system-wide emergency alert to relevant authorities"""

    def post(self, request):
        serializer = EmergencyAlertSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        alert = serializer.save(
            organisation=request.user.organisation,
            triggered_by=request.user,
        )

        # Immediately notify all relevant parties
        try:
            result = NotificationService.send_emergency_alert(alert, request.user)
            alert.notified_emails = result.get('emails', [])
            alert.notified_phones = result.get('phones', [])
            alert.save(update_fields=['notified_emails', 'notified_phones'])
        except Exception as e:
            pass

        return Response(EmergencyAlertSerializer(alert).data, status=201)

    def get(self, request):
        alerts = EmergencyAlert.objects.filter(
            organisation=request.user.organisation
        ).order_by('-created_at')[:50]
        return Response(EmergencyAlertSerializer(alerts, many=True).data)


class AcknowledgeAlertView(APIView):
    def post(self, request, alert_id):
        try:

            alert = EmergencyAlert.objects.get(
                id=alert_id, organisation=request.user.organisation
            )
            alert.acknowledged_by.add(request.user)
            # Mark resolved so it actually disappears
            alert.resolved = True
            alert.resolved_at = timezone.now()
            alert.save(update_fields=['resolved', 'resolved_at'])
            return Response(EmergencyAlertSerializer(alert).data)
        except EmergencyAlert.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def fm_heartbeat_receive(request, station_id):
    """Endpoint called by FM transmitter hardware to confirm it's running"""
    try:
        station = FMStation.objects.get(id=station_id)
        FMHeartbeat.objects.create(station=station, success=True)
        if station.current_status != 'on_air':
            station.current_status = 'on_air'
            station.last_status_change = timezone.now()
            station.save(update_fields=['current_status', 'last_status_change'])
        return Response({'status': 'ok'})
    except FMStation.DoesNotExist:
        return Response({'status': 'error'}, status=404)
