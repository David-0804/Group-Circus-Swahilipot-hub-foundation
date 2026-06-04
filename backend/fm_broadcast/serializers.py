from rest_framework import serializers
from .models import FMFrequency, StationStatus, OutageReport, RadioSchedule, ShowPlan, CallRecord

class FrequencySerializer(serializers.ModelSerializer):
    class Meta:
        model = FMFrequency
        fields = '__all__'

class StationStatusSerializer(serializers.ModelSerializer):
    frequency_name = serializers.CharField(source='frequency.name', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    class Meta:
        model = StationStatus
        fields = '__all__'

class OutageReportSerializer(serializers.ModelSerializer):
    frequency_name = serializers.CharField(source='frequency.name', read_only=True)
    reporter_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    class Meta:
        model = OutageReport
        fields = '__all__'

class ShowPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShowPlan
        fields = '__all__'

class RadioScheduleSerializer(serializers.ModelSerializer):
    presenter_name = serializers.CharField(source='presenter.full_name', read_only=True)
    frequency_name = serializers.CharField(source='frequency.name', read_only=True)
    show_plan = ShowPlanSerializer(read_only=True)
    class Meta:
        model = RadioSchedule
        fields = '__all__'

class CallRecordSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.full_name', read_only=True)
    class Meta:
        model = CallRecord
        fields = '__all__'
