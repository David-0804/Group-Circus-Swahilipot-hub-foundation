from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff, IsAdminOrIT
from .models import (WifiRequest, Software, Licence, AccessRequest,
                     TransferPackage, FeedbackCategory, Ticket, TicketResponse)
from .serializers import (WifiRequestSerializer, SoftwareSerializer, LicenceSerializer,
                           AccessRequestSerializer, TransferPackageSerializer,
                           FeedbackCategorySerializer, TicketSerializer, TicketResponseSerializer)

# ── Wi-Fi ──────────────────────────────────────────────────────────────────
class WifiRequestList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WifiRequestSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin','it']:
            stat = self.request.query_params.get('status')
            qs = WifiRequest.objects.select_related('requester').all()
            if stat: qs = qs.filter(status=stat)
            return qs
        return WifiRequest.objects.filter(requester=user)
    def perform_create(self, s): s.save(requester=self.request.user)

@api_view(['POST'])
@permission_classes([IsAdminOrIT])
def approve_wifi(request, pk):
    req = WifiRequest.objects.get(pk=pk)
    req.status = 'approved'
    req.reviewed_by = request.user
    req.reviewed_at = timezone.now()
    req.access_note = request.data.get('credentials_note','')
    days = request.data.get('duration_days', req.duration_days)
    req.access_expires_at = timezone.now() + timezone.timedelta(days=int(days))
    req.save()
    return Response({'message': 'Wi-Fi access approved'})

@api_view(['POST'])
@permission_classes([IsAdminOrIT])
def deny_wifi(request, pk):
    req = WifiRequest.objects.get(pk=pk)
    req.status = 'denied'
    req.reviewed_by = request.user
    req.reviewed_at = timezone.now()
    req.denial_reason = request.data.get('denial_reason','')
    req.save()
    return Response({'message': 'Request denied'})

# ── Subscriptions ──────────────────────────────────────────────────────────
class SoftwareList(generics.ListCreateAPIView):
    serializer_class = SoftwareSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [IsAdminOrIT()]
        return [IsAuthenticated()]
    def get_queryset(self):
        return Software.objects.filter(is_active=True)

class LicenceList(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrIT]
    serializer_class = LicenceSerializer
    queryset = Licence.objects.select_related('software').all()

class AccessRequestList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccessRequestSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin','it']: return AccessRequest.objects.all()
        return AccessRequest.objects.filter(requester=user)
    def perform_create(self, s): s.save(requester=self.request.user)

@api_view(['POST'])
@permission_classes([IsAdminOrIT])
def approve_access(request, pk):
    req = AccessRequest.objects.get(pk=pk)
    req.status = 'approved'
    req.reviewed_by = request.user
    req.reviewed_at = timezone.now()
    req.access_note = request.data.get('access_note','')
    req.save()
    return Response({'message': 'Access approved'})

# ── File Transfer ──────────────────────────────────────────────────────────
class TransferUploadView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransferPackageSerializer
    def perform_create(self, s):
        file = self.request.FILES.get('file')
        expires = timezone.now() + timezone.timedelta(hours=24)
        s.save(uploader=self.request.user, file=file,
               original_filename=file.name if file else '',
               file_size=file.size if file else 0,
               expires_at=expires)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transfer(request, token):
    try:
        pkg = TransferPackage.objects.get(token=token)
        if pkg.is_expired or timezone.now() > pkg.expires_at:
            return Response({'error': 'Link expired'}, status=410)
        return Response(TransferPackageSerializer(pkg).data)
    except TransferPackage.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

class MyTransfersView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransferPackageSerializer
    def get_queryset(self):
        return TransferPackage.objects.filter(uploader=self.request.user)

# ── Feedback ───────────────────────────────────────────────────────────────
class FeedbackCategoryList(generics.ListCreateAPIView):
    queryset = FeedbackCategory.objects.all()
    serializer_class = FeedbackCategorySerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [IsAdminOrStaff()]
        return [IsAuthenticated()]

class TicketListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin','staff']:
            qs = Ticket.objects.select_related('submitter','category').prefetch_related('responses')
            stat = self.request.query_params.get('status')
            urgency = self.request.query_params.get('urgency')
            if stat: qs = qs.filter(status=stat)
            if urgency: qs = qs.filter(urgency=urgency)
            return qs
        return Ticket.objects.filter(submitter=user).prefetch_related('responses')
    def perform_create(self, s): s.save(submitter=self.request.user)

class TicketDetail(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Ticket.objects.prefetch_related('responses')
    serializer_class = TicketSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_ticket(request, pk):
    ticket = Ticket.objects.get(pk=pk)
    resp = TicketResponse.objects.create(
        ticket=ticket, responder=request.user,
        message=request.data.get('message',''),
        is_internal=request.data.get('is_internal', False))
    if ticket.status == 'open':
        ticket.status = 'in_progress'
        ticket.save()
    return Response(TicketResponseSerializer(resp).data, status=201)
