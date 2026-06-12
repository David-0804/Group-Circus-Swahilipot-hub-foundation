"""
Nexus Chat — Serializers
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageStatus,
    ChatMedia,
    UserPresence,
    Call,
    ChatAuditLog,
)

User = get_user_model()


# ── Participant / User ─────────────────────────────────────────────────────────

class ParticipantSerializer(serializers.ModelSerializer):
    """Minimal user shape expected by the frontend Participant interface."""
    id = serializers.CharField(source="user.id")
    name = serializers.SerializerMethodField()
    role = serializers.CharField(source="user.get_role_display")
    department = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    avatar = serializers.SerializerMethodField()
    isOnline = serializers.SerializerMethodField()
    lastSeen = serializers.SerializerMethodField()

    class Meta:
        model = ConversationParticipant
        fields = ["id", "name", "role", "department", "email", "avatar", "isOnline", "lastSeen"]

    def get_name(self, obj):
        return obj.user.get_full_name()

    def get_department(self, obj):
        return obj.user.department.name if obj.user.department else None

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.user.profile_photo and request:
            return request.build_absolute_uri(obj.user.profile_photo.url)
        return None

    def get_isOnline(self, obj):
        try:
            return obj.user.presence.is_online
        except UserPresence.DoesNotExist:
            return False

    def get_lastSeen(self, obj):
        try:
            p = obj.user.presence
            if p.last_seen:
                return p.last_seen.isoformat()
        except UserPresence.DoesNotExist:
            pass
        return None


# ── Media ─────────────────────────────────────────────────────────────────────

class ChatMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnailUrl = serializers.SerializerMethodField()
    type = serializers.CharField(source="media_type")
    mimeType = serializers.CharField(source="mime_type")

    class Meta:
        model = ChatMedia
        fields = ["id", "type", "url", "name", "size", "thumbnailUrl", "mimeType"]

    def get_url(self, obj):
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return ""

    def get_thumbnailUrl(self, obj):
        request = self.context.get("request")
        if request and obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


# ── Message ───────────────────────────────────────────────────────────────────

class CallRecordSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="call_type")
    initiatorId = serializers.CharField(source="initiator_id")
    recipientId = serializers.CharField(source="recipient_id")
    startedAt = serializers.DateTimeField(source="started_at")
    endedAt = serializers.DateTimeField(source="ended_at")

    class Meta:
        model = Call
        fields = ["id", "type", "status", "initiatorId", "recipientId", "startedAt", "endedAt", "duration"]


class MessageSerializer(serializers.ModelSerializer):
    senderId = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    senderAvatar = serializers.SerializerMethodField()
    conversationId = serializers.CharField(source="conversation_id")
    timestamp = serializers.DateTimeField(source="created_at")
    media = ChatMediaSerializer(many=True, read_only=True)
    callRecord = CallRecordSerializer(source="call", read_only=True)
    replyTo = serializers.CharField(source="reply_to_id", allow_null=True)
    isSystem = serializers.BooleanField(source="is_system")

    class Meta:
        model = Message
        fields = [
            "id", "conversationId", "senderId", "senderName", "senderAvatar",
            "content", "timestamp", "status", "media", "callRecord",
            "replyTo", "isSystem",
        ]

    def get_senderId(self, obj):
        return str(obj.sender_id) if obj.sender_id else "system"

    def get_senderName(self, obj):
        return obj.sender_name

    def get_senderAvatar(self, obj):
        request = self.context.get("request")
        if obj.sender and obj.sender.profile_photo and request:
            return request.build_absolute_uri(obj.sender.profile_photo.url)
        return None


# ── Conversation ──────────────────────────────────────────────────────────────

class LastMessageSerializer(serializers.Serializer):
    """Lightweight last-message summary embedded in conversation list."""
    id = serializers.CharField()
    conversationId = serializers.CharField()
    senderId = serializers.CharField()
    senderName = serializers.CharField()
    content = serializers.CharField()
    timestamp = serializers.DateTimeField()
    status = serializers.CharField()


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    createdBy = serializers.CharField(source="created_by_id", allow_null=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "type", "name", "description", "participants",
            "lastMessage", "unreadCount", "createdAt", "createdBy", "avatar",
        ]

    def get_participants(self, obj):
        # For direct chats: return the OTHER participant from the requester's POV.
        # For groups: return all active participants.
        request = self.context.get("request")
        qs = obj.participants.filter(left_at__isnull=True).select_related(
            "user", "user__department", "user__presence"
        )
        if obj.type == "direct" and request and request.user.is_authenticated:
            qs = qs.exclude(user=request.user)
        return ParticipantSerializer(qs, many=True, context=self.context).data

    def get_lastMessage(self, obj):
        msg = obj.get_last_message()
        if not msg:
            return None
        return {
            "id": str(msg.id),
            "conversationId": str(msg.conversation_id),
            "senderId": str(msg.sender_id) if msg.sender_id else "system",
            "senderName": msg.sender_name,
            "content": msg.content,
            "timestamp": msg.created_at.isoformat(),
            "status": msg.status,
        }

    def get_unreadCount(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


# ── Presence ──────────────────────────────────────────────────────────────────

class PresenceSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source="user_id")
    isOnline = serializers.BooleanField(source="is_online")
    lastSeen = serializers.DateTimeField(source="last_seen")

    class Meta:
        model = UserPresence
        fields = ["userId", "status", "isOnline", "lastSeen"]


# ── Call ──────────────────────────────────────────────────────────────────────

class CallCreateSerializer(serializers.Serializer):
    recipient_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=["voice", "video"])
    conversation_id = serializers.UUIDField()


class CallEndSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ended", "missed", "declined"])
    duration = serializers.IntegerField(required=False, allow_null=True)


# ── Audit Log ─────────────────────────────────────────────────────────────────

class ChatAuditLogSerializer(serializers.ModelSerializer):
    performedBy = serializers.CharField(source="performed_by_id")
    performedByName = serializers.SerializerMethodField()
    groupName = serializers.CharField(source="group_name")
    timestamp = serializers.DateTimeField(source="created_at")

    class Meta:
        model = ChatAuditLog
        fields = ["id", "action", "performedBy", "performedByName", "groupName", "reason", "timestamp"]

    def get_performedByName(self, obj):
        return obj.performed_by.get_full_name() if obj.performed_by else "Unknown"