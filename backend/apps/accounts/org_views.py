"""Nexus Accounts — Organisation, Branches, Departments, MFA, Sessions"""
import pyotp
import qrcode
import base64
from io import BytesIO
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from core.models import AuditLog
from core.middleware import IsSystemAdmin, IsHROrAdmin
from .models import Organisation, Branch, Department, UserSession

User = get_user_model()


# ── Organisation ─────────────────────────────────────────────────────────────
class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore
        model = Organisation
        fields = '__all__'


class OrganisationView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganisationSerializer

    def get_object(self):
        return self.request.user.organisation


# ── Branches ─────────────────────────────────────────────────────────────────
class BranchSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:  # type: ignore
        model = Branch
        fields = '__all__'

    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()


class BranchListView(generics.ListCreateAPIView):
    serializer_class = BranchSerializer

    def get_queryset(self):
        return Branch.objects.filter(organisation=self.request.user.organisation)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchSerializer

    def get_queryset(self):
        return Branch.objects.filter(organisation=self.request.user.organisation)


# ── Departments ───────────────────────────────────────────────────────────────
class DepartmentSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:  # type: ignore
        model = Department
        fields = '__all__'

    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()


class DepartmentListView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Department.objects.filter(organisation=user.organisation)
        if user.role == 'department_leader':
            return qs.filter(id=user.department_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return Department.objects.filter(organisation=self.request.user.organisation)


# ── User Stats ────────────────────────────────────────────────────────────────
class UserStatsView(APIView):
    def get(self, request):
        org = request.user.organisation
        users = User.objects.filter(organisation=org)
        by_role = {}
        for role_key, role_label in User.ROLES:
            count = users.filter(role=role_key, is_active=True).count()
            if count > 0:
                by_role[role_label] = count

        return Response({
            'total_users':    users.count(),
            'active_users':   users.filter(is_active=True).count(),
            'inactive_users': users.filter(is_active=False).count(),
            'mfa_enabled':    users.filter(mfa_enabled=True).count(),
            'by_role':        by_role,
            'by_department':  list(
                users.filter(is_active=True)
                     .values('department__name')
                     .annotate(count=models.Count('id'))
                     .order_by('-count')[:10]
            ),
        })


# ── Bulk Import ───────────────────────────────────────────────────────────────
class BulkImportView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsSystemAdmin]

    def post(self, request):
        import csv, io
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided'}, status=400)

        created, errors = [], []
        try:
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            for i, row in enumerate(reader, 1):
                try:
                    user = User.objects.create_user(
                        email=row['email'].strip(),
                        password=row.get('password', 'TempPass@1234'),
                        first_name=row.get('first_name', '').strip(),
                        last_name=row.get('last_name', '').strip(),
                        role=row.get('role', 'attachee').strip(),
                        organisation=request.user.organisation,
                        phone=row.get('phone', '').strip(),
                        employee_id=row.get('employee_id', '').strip() or None,
                    )
                    created.append(user.email)
                except Exception as e:
                    errors.append({'row': i, 'email': row.get('email', ''), 'error': str(e)})
        except Exception as e:
            return Response({'detail': f'File parsing error: {e}'}, status=400)

        return Response({
            'created': len(created),
            'errors':  len(errors),
            'created_emails': created[:20],
            'error_details':  errors[:20],
        }, status=201 if created else 400)


# ── Change Password ───────────────────────────────────────────────────────────
class ChangePasswordView(APIView):
    def post(self, request):
        current = request.data.get('current_password')
        new_pass = request.data.get('new_password')
        if not current or not new_pass:
            return Response({'detail': 'Both current and new password required'}, status=400)
        if not request.user.check_password(current):
            return Response({'detail': 'Current password is incorrect'}, status=400)
        if len(new_pass) < 10:
            return Response({'detail': 'Password must be at least 10 characters'}, status=400)
        request.user.set_password(new_pass)
        request.user.save()
        return Response({'detail': 'Password changed successfully'})


# ── MFA Setup ─────────────────────────────────────────────────────────────────
class MFASetupView(APIView):
    def get(self, request):
        """Return QR code and secret for MFA setup"""
        user = request.user
        totp = user.get_mfa_totp()
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name='Nexus Enterprise'
        )
        img = qrcode.make(provisioning_uri)
        buffer = BytesIO()
        img.save(buffer, 'PNG')
        qr_b64 = base64.b64encode(buffer.getvalue()).decode()
        return Response({
            'secret': user.mfa_secret,
            'qr_code': f'data:image/png;base64,{qr_b64}',
            'provisioning_uri': provisioning_uri,
        })

    def post(self, request):
        """Verify and enable MFA"""
        token = request.data.get('token')
        user = request.user
        if user.verify_mfa(token):
            user.mfa_enabled = True
            user.save(update_fields=['mfa_enabled'])
            return Response({'detail': 'MFA enabled successfully'})
        return Response({'detail': 'Invalid token — MFA not enabled'}, status=400)


class MFADisableView(APIView):
    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        user = request.user
        if not user.check_password(password):
            return Response({'detail': 'Incorrect password'}, status=400)
        if not user.verify_mfa(token):
            return Response({'detail': 'Invalid MFA token'}, status=400)
        user.mfa_enabled = False
        user.mfa_secret = ''
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])
        return Response({'detail': 'MFA disabled'})


# ── Sessions ──────────────────────────────────────────────────────────────────
class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:  # type: ignore
        model = UserSession
        fields = '__all__'
        read_only_fields = ['user']


class UserSessionListView(generics.ListAPIView):
    serializer_class = UserSessionSerializer

    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user, is_active=True)


class RevokeSessionView(APIView):
    def post(self, request, pk):
        try:
            session = UserSession.objects.get(pk=pk, user=request.user)
            session.is_active = False
            session.save()
            return Response({'detail': 'Session revoked'})
        except UserSession.DoesNotExist:
            return Response({'detail': 'Session not found'}, status=404)


# ── Audit Log ────────────────────────────────────────────────────────────────
class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:  # type: ignore
        model = AuditLog
        fields = '__all__'


class AuditLogView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.filter(
            user__organisation=self.request.user.organisation
        ).select_related('user')

        user_id = self.request.query_params.get('user')
        action  = self.request.query_params.get('action')
        date    = self.request.query_params.get('date')

        if user_id:  qs = qs.filter(user_id=user_id)
        if action:   qs = qs.filter(action=action)
        if date:     qs = qs.filter(created_at__date=date)

        return qs.order_by('-created_at')

# Fix missing import
from django.db import models
