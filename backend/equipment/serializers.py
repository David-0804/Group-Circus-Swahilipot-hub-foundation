from rest_framework import serializers
from .models import EquipmentCategory, EquipmentItem, CheckoutRequest, MaintenanceRecord

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = '__all__'

class EquipmentItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = EquipmentItem
        fields = '__all__'

class CheckoutRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    items_detail = EquipmentItemSerializer(source='items', many=True, read_only=True)
    item_ids = serializers.PrimaryKeyRelatedField(
        queryset=EquipmentItem.objects.all(), many=True, write_only=True, source='items')
    class Meta:
        model = CheckoutRequest
        fields = ['id','requester','requester_name','items','items_detail','item_ids',
                  'start_date','end_date','purpose','status','requested_at',
                  'reviewed_by','reviewed_at','rejection_reason','return_confirmed_at']
        read_only_fields = ['requester','status','reviewed_by','reviewed_at','return_confirmed_at']

class MaintenanceSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    reporter_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ['reported_by','reported_at']
