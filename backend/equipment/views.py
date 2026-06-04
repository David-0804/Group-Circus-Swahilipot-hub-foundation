from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff
from .models import EquipmentCategory, EquipmentItem, CheckoutRequest, MaintenanceRecord
from .serializers import (CategorySerializer, EquipmentItemSerializer,
                           CheckoutRequestSerializer, MaintenanceSerializer)

class CategoryListCreate(generics.ListCreateAPIView):
    queryset = EquipmentCategory.objects.all()
    serializer_class = CategorySerializer
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

class ItemListCreate(generics.ListCreateAPIView):
    serializer_class = EquipmentItemSerializer
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]
    def get_queryset(self):
        qs = EquipmentItem.objects.select_related('category').all()
        cat = self.request.query_params.get('category')
        stat = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if cat: qs = qs.filter(category_id=cat)
        if stat: qs = qs.filter(status=stat)
        if search: qs = qs.filter(name__icontains=search)
        return qs

class ItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = EquipmentItem.objects.all()
    serializer_class = EquipmentItemSerializer
    def get_permissions(self):
        if self.request.method in ['PUT','PATCH','DELETE']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

class RequestListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CheckoutRequestSerializer
    def get_queryset(self):
        user = self.request.user
        qs = CheckoutRequest.objects.select_related('requester').prefetch_related('items')
        if user.role in ['admin','staff']:
            status_filter = self.request.query_params.get('status')
            if status_filter: qs = qs.filter(status=status_filter)
            return qs.order_by('-requested_at')
        return qs.filter(requester=user).order_by('-requested_at')
    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

class RequestDetail(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = CheckoutRequest.objects.all()
    serializer_class = CheckoutRequestSerializer

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def approve_request(request, pk):
    req = CheckoutRequest.objects.get(pk=pk)
    req.status = 'approved'
    req.reviewed_by = request.user
    req.reviewed_at = timezone.now()
    req.save()
    req.items.update(status='checked_out')
    return Response({'message': 'Approved'})

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def reject_request(request, pk):
    req = CheckoutRequest.objects.get(pk=pk)
    req.status = 'rejected'
    req.reviewed_by = request.user
    req.reviewed_at = timezone.now()
    req.rejection_reason = request.data.get('reason', '')
    req.save()
    return Response({'message': 'Rejected'})

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def confirm_return(request, pk):
    req = CheckoutRequest.objects.get(pk=pk)
    req.status = 'returned'
    req.return_confirmed_at = timezone.now()
    req.save()
    req.items.update(status='available')
    return Response({'message': 'Return confirmed'})

class MaintenanceListCreate(generics.ListCreateAPIView):
    serializer_class = MaintenanceSerializer
    def get_permissions(self):
        return [IsAuthenticated()]
    def get_queryset(self):
        qs = MaintenanceRecord.objects.select_related('item','reported_by').all()
        stat = self.request.query_params.get('status')
        if stat: qs = qs.filter(status=stat)
        return qs.order_by('-reported_at')
    def perform_create(self, serializer):
        item = serializer.validated_data['item']
        item.status = 'under_repair'
        item.save()
        serializer.save(reported_by=self.request.user)

class MaintenanceDetail(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminOrStaff]
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceSerializer
    def perform_update(self, serializer):
        record = serializer.save()
        if record.status == 'resolved':
            record.resolved_at = timezone.now()
            record.save()
            record.item.status = 'available'
            record.item.save()
