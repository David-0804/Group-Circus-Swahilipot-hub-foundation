"""Nexus News & Radio — Category, Frequency, Show Views"""
from django.utils import timezone
from rest_framework import generics, serializers
from .models import NewsCategory, RadioFrequency, RadioShow, RadioSlot, SeatRequest, SeatAllocation
from .models import RadioSlotSerializer, SoftwareSubscriptionSerializer


class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = '__all__'


class NewsCategoryView(generics.ListCreateAPIView):
    serializer_class = NewsCategorySerializer

    def get_queryset(self):
        return NewsCategory.objects.filter(organisation=self.request.user.organisation)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class RadioFrequencySerializer(serializers.ModelSerializer):
    class Meta:
        model = RadioFrequency
        fields = '__all__'


class RadioFrequencyView(generics.ListCreateAPIView):
    serializer_class = RadioFrequencySerializer

    def get_queryset(self):
        return RadioFrequency.objects.filter(organisation=self.request.user.organisation, is_active=True)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class RadioShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = RadioShow
        fields = '__all__'


class RadioShowView(generics.ListCreateAPIView):
    serializer_class = RadioShowSerializer

    def get_queryset(self):
        return RadioShow.objects.filter(organisation=self.request.user.organisation)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class RadioMyScheduleView(generics.ListAPIView):
    serializer_class = RadioSlotSerializer

    def get_queryset(self):
        return RadioSlot.objects.filter(
            presenter=self.request.user,
            start_datetime__gte=timezone.now(),
        ).order_by('start_datetime').select_related('show', 'frequency')


class SeatRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    subscription_name = serializers.CharField(source='subscription.software_name', read_only=True)

    class Meta:
        model = SeatRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'status']


class SeatRequestListView(generics.ListAPIView):
    serializer_class = SeatRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['broadcast_admin', 'ict', 'system_admin']:
            return SeatRequest.objects.filter(
                subscription__organisation=user.organisation
            ).select_related('requested_by', 'subscription')
        return SeatRequest.objects.filter(requested_by=user)
