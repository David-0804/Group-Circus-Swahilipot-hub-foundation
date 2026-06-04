from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, AuditLog

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['role'] = user.role
        token['department'] = user.department
        token['email'] = user.email
        return token

class UserSerializer(serializers.ModelSerializer):
    initials = serializers.ReadOnlyField()
    class Meta:
        model = CustomUser
        fields = ['id','email','full_name','department','role','phone_number',
                  'profile_photo','is_active','date_joined','last_login','initials']
        read_only_fields = ['date_joined','last_login','is_active']

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email','full_name','department','role','phone_number']

    def create(self, validated_data):
        import random, string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user = CustomUser.objects.create_user(**validated_data, password=temp_password)
        user._temp_password = temp_password
        return user

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    def validate_new_password(self, value):
        validate_password(value)
        return value

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    class Meta:
        model = AuditLog
        fields = ['id','user','user_name','action','timestamp','ip_address','notes']
