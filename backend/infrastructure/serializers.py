from rest_framework import serializers
from .models import (WifiRequest, Software, Licence, AccessRequest,
                     TransferPackage, FeedbackCategory, Ticket, TicketResponse)

class WifiRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    class Meta:
        model = WifiRequest
        fields = '__all__'
        read_only_fields = ['requester','status','reviewed_by','reviewed_at','access_expires_at']

class SoftwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Software
        fields = '__all__'

class LicenceSerializer(serializers.ModelSerializer):
    software_name = serializers.CharField(source='software.name', read_only=True)
    used_seats = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    class Meta:
        model = Licence
        fields = '__all__'

class AccessRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    software_name = serializers.CharField(source='licence.software.name', read_only=True)
    class Meta:
        model = AccessRequest
        fields = '__all__'
        read_only_fields = ['requester','status','reviewed_by','reviewed_at']

class TransferPackageSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source='uploader.full_name', read_only=True)
    class Meta:
        model = TransferPackage
        fields = ['id','token','original_filename','file_size','created_at',
                  'expires_at','max_downloads','download_count','is_expired','uploader_name']

class FeedbackCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackCategory
        fields = '__all__'

class TicketResponseSerializer(serializers.ModelSerializer):
    responder_name = serializers.CharField(source='responder.full_name', read_only=True)
    class Meta:
        model = TicketResponse
        fields = '__all__'
        read_only_fields = ['responder','responded_at']

class TicketSerializer(serializers.ModelSerializer):
    submitter_name = serializers.CharField(source='submitter.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    responses = TicketResponseSerializer(many=True, read_only=True)
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['submitter','created_at','updated_at']
