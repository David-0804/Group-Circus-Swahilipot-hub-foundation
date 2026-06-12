"""
Nexus Chat — Initial Migration
Generated manually (auto-generated format).
Run: python manage.py migrate apps.chat
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Conversation ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("type", models.CharField(choices=[("direct", "Direct Message"), ("group", "Group Chat")], default="direct", max_length=10)),
                ("name", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField(blank=True)),
                ("avatar", models.ImageField(blank=True, null=True, upload_to="chat/avatars/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="created_conversations",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-updated_at"]},
        ),

        # ── ConversationParticipant ───────────────────────────────────────────
        migrations.CreateModel(
            name="ConversationParticipant",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("last_read_at", models.DateTimeField(blank=True, null=True)),
                ("is_admin", models.BooleanField(default=False)),
                ("left_at", models.DateTimeField(blank=True, null=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="participants", to="chat.conversation")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_participations", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name="conversationparticipant",
            unique_together={("conversation", "user")},
        ),

        # ── Message ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("sender_name_override", models.CharField(blank=True, max_length=100)),
                ("content", models.TextField(blank=True)),
                ("status", models.CharField(
                    choices=[("sending", "Sending"), ("sent", "Sent"), ("delivered", "Delivered"), ("seen", "Seen")],
                    default="sent", max_length=10,
                )),
                ("is_system", models.BooleanField(default=False)),
                ("is_deleted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="chat.conversation")),
                ("sender", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="sent_messages",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("reply_to", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="replies",
                    to="chat.message",
                )),
            ],
            options={"ordering": ["created_at"]},
        ),

        # ── MessageStatus ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="MessageStatus",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(
                    choices=[("sending", "Sending"), ("sent", "Sent"), ("delivered", "Delivered"), ("seen", "Seen")],
                    default="sent", max_length=10,
                )),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("message", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="delivery_statuses", to="chat.message")),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="message_statuses", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name="messagestatus",
            unique_together={("message", "recipient")},
        ),

        # ── ChatMedia ─────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="ChatMedia",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("file", models.FileField(upload_to="chat/media/%Y/%m/")),
                ("thumbnail", models.ImageField(blank=True, null=True, upload_to="chat/thumbs/")),
                ("media_type", models.CharField(
                    choices=[("image", "Image"), ("video", "Video"), ("audio", "Audio"), ("document", "Document")],
                    max_length=10,
                )),
                ("name", models.CharField(max_length=255)),
                ("size", models.PositiveBigIntegerField(default=0)),
                ("mime_type", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("message", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media", to="chat.message")),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="shared_media", to="chat.conversation")),
                ("uploaded_by", models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="chat_uploads",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),

        # ── UserPresence ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="UserPresence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("status", models.CharField(
                    choices=[("online", "Online"), ("away", "Away"), ("offline", "Offline")],
                    default="offline", max_length=10,
                )),
                ("last_seen", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="presence", to=settings.AUTH_USER_MODEL)),
            ],
        ),

        # ── Call ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Call",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("call_type", models.CharField(choices=[("voice", "Voice"), ("video", "Video")], max_length=5)),
                ("status", models.CharField(
                    choices=[("ringing", "Ringing"), ("connected", "Connected"), ("ended", "Ended"), ("missed", "Missed"), ("declined", "Declined")],
                    default="ringing", max_length=10,
                )),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("duration", models.PositiveIntegerField(blank=True, null=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="calls", to="chat.conversation")),
                ("initiator", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="initiated_calls", to=settings.AUTH_USER_MODEL)),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="received_calls", to=settings.AUTH_USER_MODEL)),
                ("message", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="call", to="chat.message")),
            ],
            options={"ordering": ["-started_at"]},
        ),

        # ── ChatAuditLog ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="ChatAuditLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("action", models.CharField(
                    choices=[
                        ("group_created", "Group Created"),
                        ("group_creation_denied", "Group Creation Denied"),
                        ("member_added", "Member Added"),
                        ("member_removed", "Member Removed"),
                        ("group_updated", "Group Updated"),
                        ("message_deleted", "Message Deleted"),
                    ],
                    max_length=30,
                )),
                ("group_name", models.CharField(blank=True, max_length=100)),
                ("reason", models.TextField(blank=True)),
                ("extra", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("conversation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to="chat.conversation")),
                ("performed_by", models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="chat_audit_logs",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]