from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff
from .models import FMFrequency, StationStatus, OutageReport, RadioSchedule, ShowPlan, CallRecord
from .serializers import (FrequencySerializer, StationStatusSerializer, OutageReportSerializer,
                           RadioScheduleSerializer, ShowPlanSerializer, CallRecordSerializer)

class FrequencyList(generics.ListCreateAPIView):
    queryset = FMFrequency.objects.all()
    serializer_class = FrequencySerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [IsAdminOrStaff()]
        return [IsAuthenticated()]

class CurrentStatusView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StationStatusSerializer
    def get_queryset(self):
        freqs = FMFrequency.objects.filter(is_active=True)
        statuses = []
        for f in freqs:
            s = StationStatus.objects.filter(frequency=f).first()
            if s: statuses.append(s.pk)
        return StationStatus.objects.filter(pk__in=statuses)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_down(request):
    freq_id = request.data.get('frequency_id')
    freq = FMFrequency.objects.get(pk=freq_id)
    StationStatus.objects.create(frequency=freq, status='off_air',
        changed_by=request.user, notes=request.data.get('description',''))
    OutageReport.objects.create(frequency=freq, reported_by=request.user,
        description=request.data.get('description',''))
    return Response({'message': 'Outage reported'}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_up(request):
    freq_id = request.data.get('frequency_id')
    freq = FMFrequency.objects.get(pk=freq_id)
    StationStatus.objects.create(frequency=freq, status='on_air',
        changed_by=request.user, notes=request.data.get('notes',''))
    outage = OutageReport.objects.filter(frequency=freq, ended_at__isnull=True).first()
    if outage:
        outage.ended_at = timezone.now()
        delta = (outage.ended_at - outage.started_at).total_seconds()
        outage.duration_minutes = round(delta / 60, 1)
        outage.save()
    return Response({'message': 'Station restored'})

class OutageLogView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OutageReportSerializer
    def get_queryset(self):
        qs = OutageReport.objects.select_related('frequency','reported_by').all()
        freq = self.request.query_params.get('frequency')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if freq: qs = qs.filter(frequency_id=freq)
        if date_from: qs = qs.filter(started_at__date__gte=date_from)
        if date_to: qs = qs.filter(started_at__date__lte=date_to)
        return qs

class ScheduleListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RadioScheduleSerializer
    def get_queryset(self):
        user = self.request.user
        qs = RadioSchedule.objects.select_related('presenter','frequency').prefetch_related('show_plan')
        week = self.request.query_params.get('week')
        presenter = self.request.query_params.get('presenter')
        if user.role == 'student': return qs.filter(presenter=user).order_by('start_datetime')
        if presenter: qs = qs.filter(presenter_id=presenter)
        return qs.order_by('start_datetime')
    def perform_create(self, s): s.save()

class ScheduleDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrStaff]
    queryset = RadioSchedule.objects.all()
    serializer_class = RadioScheduleSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_show_plan(request, pk):
    schedule = RadioSchedule.objects.get(pk=pk)
    plan, created = ShowPlan.objects.update_or_create(
        schedule=schedule,
        defaults={'content_notes': request.data.get('content_notes',''),
                  'guests': request.data.get('guests','')})
    return Response(ShowPlanSerializer(plan).data, status=201 if created else 200)

class CallListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CallRecordSerializer
    def get_queryset(self):
        return CallRecord.objects.select_related('operator').all()
    def perform_create(self, s): s.save(operator=self.request.user)
