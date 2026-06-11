"""Nexus Attendance — GPS Geofencing, Check-in/out, Violations"""
import math
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import TimeStampedModel, AuditedModel


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in metres between two GPS coordinates"""
    R = 6371000  # Earth radius in metres
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class AttendanceRecord(TimeStampedModel):
    """Individual attendance check-in/out record"""
    STATUS_CHOICES = [
        ('present', 'Present'), ('absent', 'Absent'), ('late', 'Late'),
        ('half_day', 'Half Day'), ('leave', 'On Leave'), ('holiday', 'Public Holiday'),
    ]
    METHOD_CHOICES = [
        ('gps', 'GPS Check-in'), ('qr', 'QR Code'), ('facial', 'Facial Recognition'),
        ('manual', 'Manual Entry'), ('system', 'System Generated'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    check_in_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    check_out_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    check_in_distance_metres = models.FloatField(null=True, blank=True)
    check_out_distance_metres = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='gps')
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    supervisor_approved = models.BooleanField(null=True)
    approved_by = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_attendance')
    qr_code_used = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = [['user', 'date']]
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def calculate_hours(self):
        if self.check_in_time and self.check_out_time:
            delta = self.check_out_time - self.check_in_time
            return round(delta.total_seconds() / 3600, 2)
        return None

    def save(self, *args, **kwargs):
        if self.check_in_time and self.check_out_time:
            self.total_hours = self.calculate_hours()
        super().save(*args, **kwargs)


class GeofenceViolation(TimeStampedModel):
    """Records when a user leaves the workplace geofence without checking out"""
    attendance = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='violations')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='geofence_violations')
    timestamp = models.DateTimeField(default=timezone.now)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    distance_from_workplace = models.FloatField()
    alert_sent = models.BooleanField(default=False)
    acknowledged = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']


class LeaveRequest(TimeStampedModel):
    LEAVE_TYPES = [
        ('annual', 'Annual Leave'), ('sick', 'Sick Leave'),
        ('maternity', 'Maternity Leave'), ('paternity', 'Paternity Leave'),
        ('emergency', 'Emergency Leave'), ('study', 'Study Leave'),
        ('unpaid', 'Unpaid Leave'), ('other', 'Other'),
    ]
    STATUS = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('rejected', 'Rejected'), ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    days_requested = models.IntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='leave_reviews')
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    attachments = models.FileField(upload_to='leave/attachments/', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


# ─── SERIALIZERS ─────────────────────────────────────────────────────────────

class AttendanceRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    is_checked_in = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = '__all__'

    def get_is_checked_in(self, obj):
        return obj.check_in_time is not None and obj.check_out_time is None


class CheckInSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    method = serializers.ChoiceField(choices=['gps', 'qr', 'facial', 'manual'], default='gps')
    qr_code = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)


# ─── VIEWS ───────────────────────────────────────────────────────────────────

class CheckInView(APIView):
    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = request.user
        today = timezone.now().date()

        # Check if already checked in today
        existing = AttendanceRecord.objects.filter(user=user, date=today).first()
        if existing and existing.check_in_time:
            return Response({'detail': 'Already checked in today'}, status=400)

        lat = serializer.validated_data['latitude']
        lon = serializer.validated_data['longitude']

        # Geofence check
        distance = None
        if user.branch and user.branch.latitude and user.branch.longitude:
            distance = haversine_distance(
                user.branch.latitude, user.branch.longitude, lat, lon
            )
            radius = user.branch.geofence_radius
            if distance > radius and serializer.validated_data['method'] == 'gps':
                return Response({
                    'detail': f'You are {int(distance)}m from the workplace. Must be within {radius}m to check in.',
                    'distance': int(distance),
                    'allowed_radius': radius,
                }, status=400)

        record, _ = AttendanceRecord.objects.get_or_create(user=user, date=today)
        record.check_in_time = timezone.now()
        record.check_in_latitude = lat
        record.check_in_longitude = lon
        record.check_in_distance_metres = distance
        record.method = serializer.validated_data['method']
        record.qr_code_used = serializer.validated_data.get('qr_code', '')

        # Determine if late (after 09:00)
        if timezone.now().hour >= 9:
            record.status = 'late'
        else:
            record.status = 'present'

        record.save()
        return Response(AttendanceRecordSerializer(record).data, status=201)


class CheckOutView(APIView):
    def post(self, request):
        user = request.user
        today = timezone.now().date()

        record = AttendanceRecord.objects.filter(
            user=user, date=today, check_in_time__isnull=False, check_out_time__isnull=True
        ).first()

        if not record:
            return Response({'detail': 'No active check-in found for today'}, status=400)

        serializer = CheckOutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        record.check_out_time = timezone.now()
        record.check_out_latitude = serializer.validated_data['latitude']
        record.check_out_longitude = serializer.validated_data['longitude']

        if record.check_in_time and record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            if delta.total_seconds() < 14400:  # less than 4 hours
                record.status = 'half_day'

        record.save()
        return Response(AttendanceRecordSerializer(record).data)


class AttendanceHistoryView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['supervisor', 'department_leader', 'hr_officer', 'system_admin']:
            dept = self.request.query_params.get('department')
            target_user = self.request.query_params.get('user_id')
            qs = AttendanceRecord.objects.filter(user__organisation=user.organisation)
            if dept:
                qs = qs.filter(user__department_id=dept)
            if target_user:
                qs = qs.filter(user_id=target_user)
            return qs
        return AttendanceRecord.objects.filter(user=user)


class LeaveRequestView(generics.ListCreateAPIView):
    serializer_class = serializers.ModelSerializer

    class LeaveSerializer(serializers.ModelSerializer):
        class Meta:
            model = LeaveRequest
            fields = '__all__'
            read_only_fields = ['user', 'status', 'reviewed_by', 'review_notes', 'reviewed_at']

    serializer_class = LeaveSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['hr_officer', 'supervisor', 'system_admin']:
            return LeaveRequest.objects.filter(user__organisation=user.organisation)
        return LeaveRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
