from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff
from .models import ShootLocation, ShootBooking, FootageUpload
from .serializers import LocationSerializer, ShootBookingSerializer, FootageSerializer

class LocationList(generics.ListCreateAPIView):
    queryset = ShootLocation.objects.filter(is_active=True)
    serializer_class = LocationSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [IsAdminOrStaff()]
        return [IsAuthenticated()]

class BookingListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShootBookingSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin','staff']:
            stat = self.request.query_params.get('status')
            qs = ShootBooking.objects.select_related('requester','location').prefetch_related('footage')
            if stat: qs = qs.filter(status=stat)
            return qs.order_by('-created_at')
        return ShootBooking.objects.filter(requester=user).order_by('-created_at')
    def perform_create(self, s): s.save(requester=self.request.user)

class BookingDetail(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ShootBooking.objects.prefetch_related('footage','equipment_items')
    serializer_class = ShootBookingSerializer

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def approve_booking(request, pk):
    b = ShootBooking.objects.get(pk=pk)
    b.status = 'approved'
    b.approved_by = request.user
    b.approved_at = timezone.now()
    b.save()
    return Response({'message': 'Booking approved'})

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def decline_booking(request, pk):
    b = ShootBooking.objects.get(pk=pk)
    b.status = 'declined'
    b.decline_reason = request.data.get('reason','')
    b.save()
    return Response({'message': 'Booking declined'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_footage(request, pk):
    booking = ShootBooking.objects.get(pk=pk)
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'File required'}, status=400)
    footage = FootageUpload.objects.create(
        booking=booking, uploaded_by=request.user,
        file=file, original_filename=file.name,
        file_size=file.size,
        description=request.data.get('description',''))
    if booking.status == 'approved':
        booking.status = 'completed'
        booking.save()
    return Response(FootageSerializer(footage).data, status=201)

class FootageArchive(generics.ListAPIView):
    permission_classes = [IsAdminOrStaff]
    serializer_class = FootageSerializer
    def get_queryset(self):
        qs = FootageUpload.objects.select_related('booking','uploaded_by')
        ftype = self.request.query_params.get('type')
        if ftype: qs = qs.filter(file_type=ftype)
        return qs.order_by('-uploaded_at')
