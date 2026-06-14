import uuid
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("type", models.CharField(choices=[("direct", "Direct"), ("group", "Group")], max_length=10)),
                ("name", models.CharField(blank=True, max_length=150, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_conversations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"], "app_label": "chat"},
        ),
        migrations.CreateModel(
            name="ConversationMember",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("last_read_at", models.DateTimeField(blank=True, null=True)),
                ("is_admin", models.BooleanField(default=False)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="members",
                        to="chat.conversation",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chat_memberships",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"unique_together": {("conversation", "user")}, "app_label": "chat"},
        ),
        migrations.CreateModel(
            name="ChatMedia",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("file", models.FileField(upload_to="chat/media/%Y/%m/")),
                ("original_name", models.CharField(max_length=255)),
                (
                    "media_type",
                    models.CharField(
                        choices=[
                            ("image", "Image"), ("video", "Video"),
                            ("audio", "Audio"), ("document", "Document"),
                        ],
                        max_length=10,
                    ),
                ),
                ("mime_type", models.CharField(blank=True, max_length=100)),
                ("size", models.PositiveBigIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="media_files",
                        to="chat.conversation",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"app_label": "chat"},
        ),
        migrations.CreateModel(
            name="Call",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                (
                    "call_type",
                    models.CharField(
                        choices=[("voice", "Voice"), ("video", "Video")], max_length=10
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ringing", "Ringing"), ("connected", "Connected"),
                            ("ended", "Ended"), ("missed", "Missed"), ("declined", "Declined"),
                        ],
                        default="ringing",
                        max_length=10,
                    ),
                ),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("connected_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("duration", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="calls",
                        to="chat.conversation",
                    ),
                ),
                (
                    "initiator",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="initiated_calls",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="received_calls",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"app_label": "chat"},
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("content", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("sending", "Sending"), ("sent", "Sent"),
                            ("delivered", "Delivered"), ("seen", "Seen"),
                        ],
                        default="sent",
                        max_length=10,
                    ),
                ),
                ("is_system", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="chat.conversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_chat_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "call_record",
                    models.OneToOneField(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="message",
                        to="chat.call",
                    ),
                ),
                (
                    "media",
                    models.ManyToManyField(
                        blank=True, related_name="messages", to="chat.chatmedia"
                    ),
                ),
            ],
            options={"ordering": ["created_at"], "app_label": "chat"},
        ),
        migrations.CreateModel(
            name="MessageReceipt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("seen_at", models.DateTimeField(blank=True, null=True)),
                (
                    "message",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="receipts",
                        to="chat.message",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"unique_together": {("message", "user")}, "app_label": "chat"},
        ),
        migrations.CreateModel(
            name="UserPresence",
            fields=[
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="presence",
                        serialize=False,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("online", "Online"), ("away", "Away"), ("offline", "Offline")
                        ],
                        default="offline",
                        max_length=10,
                    ),
                ),
                ("last_seen", models.DateTimeField(auto_now=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"app_label": "chat"},
        ),
        migrations.CreateModel(
            name="GroupAuditLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ("action", models.CharField(max_length=50)),
                ("actor_role", models.CharField(blank=True, max_length=50)),
                ("group_name", models.CharField(blank=True, max_length=150)),
                ("success", models.BooleanField(default=False)),
                ("detail", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "conversation",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="chat.conversation",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"], "app_label": "chat"},
        ),
    ]
