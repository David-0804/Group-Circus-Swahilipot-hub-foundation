from rest_framework import serializers
from .models import ShootLocation, ShootBooking, FootageUpload

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShootLocation
        fields = '__all__'

class FootageSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    class Meta:
        model = FootageUpload
        fields = '__all__'
        read_only_fields = ['uploaded_by','uploaded_at']

class ShootBookingSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    footage = FootageSerializer(many=True, read_only=True)
    class Meta:
        model = ShootBooking
        fields = '__all__'
        read_only_fields = ['requester','status','approved_by','approved_at']
