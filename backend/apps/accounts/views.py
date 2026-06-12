"""Nexus Accounts — Serializers, Views, JWT"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers, generics, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        token['org_id'] = str(user.organisation_id) if user.organisation_id else None
        token['branch_id'] = str(user.branch_id) if user.branch_id else None
        token['mfa_required'] = user.mfa_enabled and not user.mfa_verified
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        data['user'] = UserProfileSerializer(user).data
        data['mfa_required'] = user.mfa_enabled
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MFAVerifyView(APIView):
    def post(self, request):
        token = request.data.get('token')
        user = request.user
        if user.verify_mfa(token):
            user.mfa_verified = True
            user.save(update_fields=['mfa_verified'])
            return Response({'verified': True})
        return Response({'verified': False, 'detail': 'Invalid MFA code'}, status=400)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh = request.data.get('refresh')
            if refresh:
                token = RefreshToken(refresh)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'})
        except Exception:
            return Response({'detail': 'Token already invalid.'}, status=400)


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    organisation_name = serializers.CharField(source='organisation.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'employee_id', 'first_name', 'last_name', 'full_name',
            'phone', 'profile_photo', 'role', 'role_display',
            'organisation', 'organisation_name', 'branch', 'branch_name',
            'department', 'department_name', 'bio', 'date_of_birth',
            'emergency_contact_name', 'emergency_contact_phone',
            'mfa_enabled', 'notification_email', 'notification_sms', 'notification_push',
            'date_joined', 'last_login', 'is_active',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login']

    def get_profile_photo(self, obj):
        if not obj.profile_photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return obj.profile_photo.url


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'employee_id', 'full_name', 'role', 'role_display',
            'department', 'department_name', 'branch', 'branch_name',
            'is_active', 'date_joined', 'profile_photo',
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'employee_id',
            'phone', 'role', 'branch', 'department',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        # organisation is injected by perform_create — not accepted from client
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        # SerializerMethodField handles read; write the file manually here
        instance = serializer.save()
        photo = self.request.FILES.get("profile_photo")
        if photo:
            instance.profile_photo = photo
            instance.save(update_fields=["profile_photo"])


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related('department', 'branch', 'organisation')
        if user.role == 'system_admin':
            qs = qs.filter(organisation=user.organisation)
        elif user.role in ['hr_officer', 'executive']:
            qs = qs.filter(organisation=user.organisation)
        elif user.role == 'department_leader':
            qs = qs.filter(department=user.department)
        elif user.role == 'supervisor':
            qs = qs.filter(department=user.department)
        else:
            qs = qs.filter(id=user.id)

        # Optional role filter from query param (e.g. ?role=attachee)
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)

        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        # Always assign the organisation of the requesting user
        serializer.save(organisation=self.request.user.organisation)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return User.objects.filter(organisation=self.request.user.organisation)

    def perform_destroy(self, instance):
        # Soft deactivate instead of hard delete
        instance.is_active = False
        instance.save(update_fields=['is_active'])

        