from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import AuditLog
from .serializers import UserSerializer, UserCreateSerializer, AuditLogSerializer, PasswordChangeSerializer
from .permissions import IsAdmin

User = get_user_model()

def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email'))
            AuditLog.objects.create(user=user, action='login', ip_address=get_client_ip(request))
        return response

class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            AuditLog.objects.create(user=request.user, action='logout', ip_address=get_client_ip(request))
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response({'error': 'Invalid token'}, status=400)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    def post(self, request):
        s = PasswordChangeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(s.validated_data['old_password']):
            return Response({'error': 'Wrong current password'}, status=400)
        user.set_password(s.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated'})

class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(full_name__icontains=search) | qs.filter(email__icontains=search)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(user=self.request.user, action='account_created',
            notes=f'Created account for {user.email}')

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer

class AuditLogView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('user').all()

class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        from equipment.models import EquipmentItem, CheckoutRequest
        from projects.models import Submission
        from fm_broadcast.models import StationStatus
        from news.models import NewsStory
        from infrastructure.models import WifiRequest, Ticket, Licence
        from videography.models import ShootBooking
        from django.utils import timezone
        today = timezone.now().date()

        try:
            fm_status = StationStatus.objects.order_by('-changed_at').first()
            fm_on_air = fm_status.status == 'on_air' if fm_status else False
        except:
            fm_on_air = False

        stats = {
            'equipment': {
                'on_loan': CheckoutRequest.objects.filter(status='approved').count(),
                'overdue': CheckoutRequest.objects.filter(status='overdue').count(),
                'under_repair': EquipmentItem.objects.filter(status='under_repair').count(),
                'total': EquipmentItem.objects.count(),
            },
            'projects': {
                'pending_review': Submission.objects.filter(status='submitted').count(),
                'submitted_today': Submission.objects.filter(submitted_at__date=today).count(),
            },
            'fm': {
                'on_air': fm_on_air,
            },
            'news': {
                'published_today': NewsStory.objects.filter(status='published', published_at__date=today).count(),
                'pending_review': NewsStory.objects.filter(status='submitted').count(),
                'drafts': NewsStory.objects.filter(status='draft').count(),
            },
            'wifi': {
                'pending_requests': WifiRequest.objects.filter(status='pending').count(),
            },
            'subscriptions': {
                'expiring_soon': Licence.objects.filter(
                    expiry_date__lte=timezone.now().date() + timezone.timedelta(days=30)
                ).count(),
            },
            'feedback': {
                'open_tickets': Ticket.objects.filter(status='open').count(),
                'critical': Ticket.objects.filter(status='open', urgency='critical').count(),
            },
            'videography': {
                'shoots_this_week': ShootBooking.objects.filter(
                    shoot_date__gte=today, shoot_date__lte=today + timezone.timedelta(days=7)
                ).count(),
            },
            'users': {
                'total': User.objects.count(),
                'students': User.objects.filter(role='student').count(),
                'staff': User.objects.filter(role='staff').count(),
            }
        }
        return Response(stats)
