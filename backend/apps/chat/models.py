"""
Nexus Chat — Database Models
Covers: Conversations, Messages, Media, Presence, Calls, Audit Logs
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

AUTH_USER_MODEL = settings.AUTH_USER_MODEL


# ── Conversation ──────────────────────────────────────────────────────────────

class Conversation(models.Model):
    TYPES = [("direct", "Direct Message"), ("group", "Group Chat")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=TYPES, default="direct")

    # Group-only fields
    name = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="chat/avatars/", null=True, blank=True)
    created_by = models.ForeignKey(
        AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="created_conversations",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        if self.type == "group":
            return f"#{self.name}"
        participants = self.participants.select_related("user").all()
        names = ", ".join(p.user.get_full_name() for p in participants[:2])
        return f"DM: {names}"

    def get_unread_count(self, user):
        """Messages in this conversation that the user hasn't read yet."""
        last_read = self.participants.filter(user=user).values_list(
            "last_read_at", flat=True
        ).first()
        qs = self.messages.filter(is_deleted=False).exclude(sender=user)
        if last_read:
            qs = qs.filter(created_at__gt=last_read)
        return qs.count()

    def get_last_message(self):
        return self.messages.filter(is_deleted=False).order_by("-created_at").first()


class ConversationParticipant(models.Model):
    """Through-table: user ↔ conversation with per-user metadata."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="participants"
    )
    user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_participations"
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_admin = models.BooleanField(default=False)  # group admin
    left_at = models.DateTimeField(null=True, blank=True)  # set on leave

    class Meta:
        unique_together = [["conversation", "user"]]

    def __str__(self):
        return f"{self.user.get_full_name()} in {self.conversation}"

    @property
    def is_active(self):
        return self.left_at is None


# ── Message ───────────────────────────────────────────────────────────────────

class Message(models.Model):
    STATUS = [
        ("sending", "Sending"),
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("seen", "Seen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        AUTH_USER_MODEL,
        null=True, blank=True,  # null for system messages
        on_delete=models.SET_NULL,
        related_name="sent_messages",
    )
    # For system messages we need a display name even without a real sender
    sender_name_override = models.CharField(max_length=100, blank=True)

    content = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default="sent")

    # Threading
    reply_to = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="replies"
    )
    is_system = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        sender = self.sender.get_full_name() if self.sender else "System"
        return f"{sender}: {self.content[:60]}"

    @property
    def sender_name(self):
        if self.sender_name_override:
            return self.sender_name_override
        return self.sender.get_full_name() if self.sender else "System"


class MessageStatus(models.Model):
    """Per-recipient delivery/read status for each message."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="delivery_statuses"
    )
    recipient = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_statuses"
    )
    status = models.CharField(
        max_length=10,
        choices=Message.STATUS,
        default="sent",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["message", "recipient"]]


# ── Media ─────────────────────────────────────────────────────────────────────

class ChatMedia(models.Model):
    MEDIA_TYPES = [
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("document", "Document"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="media", null=True, blank=True
    )
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="shared_media"
    )
    uploaded_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="chat_uploads"
    )
    file = models.FileField(upload_to="chat/media/%Y/%m/")
    thumbnail = models.ImageField(upload_to="chat/thumbs/", null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    name = models.CharField(max_length=255)
    size = models.PositiveBigIntegerField(default=0)  # bytes
    mime_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.media_type})"


# ── Presence ──────────────────────────────────────────────────────────────────

class UserPresence(models.Model):
    STATUS = [
        ("online", "Online"),
        ("away", "Away"),
        ("offline", "Offline"),
    ]

    user = models.OneToOneField(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presence"
    )
    status = models.CharField(max_length=10, choices=STATUS, default="offline")
    last_seen = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.status}"

    @property
    def is_online(self):
        return self.status == "online"


# ── Calls ─────────────────────────────────────────────────────────────────────

class Call(models.Model):
    CALL_TYPES = [("voice", "Voice"), ("video", "Video")]
    CALL_STATUS = [
        ("ringing", "Ringing"),
        ("connected", "Connected"),
        ("ended", "Ended"),
        ("missed", "Missed"),
        ("declined", "Declined"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="calls"
    )
    initiator = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="initiated_calls"
    )
    recipient = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_calls"
    )
    call_type = models.CharField(max_length=5, choices=CALL_TYPES)
    status = models.CharField(max_length=10, choices=CALL_STATUS, default="ringing")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # seconds
    # Link to the message bubble that was created for this call
    message = models.OneToOneField(
        Message, null=True, blank=True, on_delete=models.SET_NULL, related_name="call"
    )

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.call_type} call: {self.initiator} → {self.recipient} ({self.status})"


# ── Chat Audit Log ─────────────────────────────────────────────────────────────

class ChatAuditLog(models.Model):
    ACTIONS = [
        ("group_created", "Group Created"),
        ("group_creation_denied", "Group Creation Denied"),
        ("member_added", "Member Added"),
        ("member_removed", "Member Removed"),
        ("group_updated", "Group Updated"),
        ("message_deleted", "Message Deleted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=30, choices=ACTIONS)
    performed_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="chat_audit_logs"
    )
    conversation = models.ForeignKey(
        Conversation, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    group_name = models.CharField(max_length=100, blank=True)
    reason = models.TextField(blank=True)
    extra = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        actor = self.performed_by.get_full_name() if self.performed_by else "Unknown"
        return f"{actor} — {self.action} @ {self.created_at:%Y-%m-%d %H:%M}"