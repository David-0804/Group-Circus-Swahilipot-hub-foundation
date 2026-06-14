"""
apps/chat/models.py
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    TYPE_CHOICES = [("direct", "Direct"), ("group", "Group")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    name = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="created_conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        app_label = "chat"

    def __str__(self):
        return self.name or f"DM:{self.id}"

    def get_unread_count(self, user):
        member = self.members.filter(user=user).first()
        if not member:
            return 0
        cutoff = member.last_read_at
        if not cutoff:
            return self.messages.exclude(sender=user).count()
        return self.messages.filter(
            created_at__gt=cutoff
        ).exclude(sender=user).count()


class ConversationMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_admin = models.BooleanField(default=False)

    class Meta:
        unique_together = ("conversation", "user")
        app_label = "chat"

    def __str__(self):
        return f"{self.user} in {self.conversation}"


class ChatMedia(models.Model):
    TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("document", "Document"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="media_files"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    file = models.FileField(upload_to="chat/media/%Y/%m/")
    original_name = models.CharField(max_length=255)
    media_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    mime_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "chat"

    def __str__(self):
        return f"{self.media_type}:{self.original_name}"


class Call(models.Model):
    TYPE_CHOICES = [("voice", "Voice"), ("video", "Video")]
    STATUS_CHOICES = [
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
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="initiated_calls",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_calls",
    )
    call_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ringing")
    started_at = models.DateTimeField(auto_now_add=True)
    connected_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        app_label = "chat"

    def __str__(self):
        return f"{self.call_type} {self.initiator} → {self.recipient} [{self.status}]"


class Message(models.Model):
    STATUS_CHOICES = [
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
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_chat_messages",
    )
    content = models.TextField(blank=True)
    media = models.ManyToManyField(ChatMedia, blank=True, related_name="messages")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="sent")
    is_system = models.BooleanField(default=False)
    call_record = models.OneToOneField(
        Call,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="message",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        app_label = "chat"

    def __str__(self):
        return f"Msg({self.sender_id}) in {self.conversation_id}"


class MessageReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="receipts"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    delivered_at = models.DateTimeField(null=True, blank=True)
    seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("message", "user")
        app_label = "chat"


class UserPresence(models.Model):
    STATUS_CHOICES = [
        ("online", "Online"),
        ("away", "Away"),
        ("offline", "Offline"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="presence",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="offline")
    last_seen = models.DateTimeField(auto_now=True)
    # updated_at mirrors last_seen — needed because the DB table already has this column
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "chat"

    def __str__(self):
        return f"{self.user}: {self.status}"


class GroupAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=50)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    actor_role = models.CharField(max_length=50, blank=True)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.SET_NULL, null=True, blank=True
    )
    group_name = models.CharField(max_length=150, blank=True)
    success = models.BooleanField(default=False)
    detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        app_label = "chat"

    def __str__(self):
        return f"{self.action} by {self.actor_id} – {'OK' if self.success else 'DENIED'}"
