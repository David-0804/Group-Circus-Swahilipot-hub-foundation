"""
Nexus Chat — REST API Views

Endpoints (all under /api/v1/chat/):
  GET/POST  conversations/
  GET       conversations/<id>/
  POST      conversations/direct/
  POST      conversations/groups/
  PATCH     conversations/<id>/
  POST      conversations/<id>/leave/
  GET/POST  conversations/<id>/messages/
  POST      conversations/<id>/read/
  GET       conversations/<id>/media/
  GET       conversations/<id>/calls/
  POST      chat/media/
  GET       presence/online/
  POST      presence/
  POST      calls/
  PATCH     calls/<id>/
  GET       unread-count/
  GET       audit-logs/
"""
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Conversation,
    ConversationParticipant,
    Message,
    ChatMedia,
    UserPresence,
    Call,
    ChatAuditLog,
)
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    ChatMediaSerializer,
    PresenceSerializer,
    CallCreateSerializer,
    CallEndSerializer,
    ChatAuditLogSerializer,
)

User = get_user_model()

# Roles that can create groups
GROUP_ADMIN_ROLES = {"system_admin", "broadcast_admin", "hr_officer", "executive"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_conversation_or_404(pk, user):
    """Return a Conversation the user is an active participant of, or raise 404."""
    try:
        conv = Conversation.objects.get(pk=pk)
        if not conv.participants.filter(user=user, left_at__isnull=True).exists():
            return None, Response({"detail": "Not a participant."}, status=403)
        return conv, None
    except Conversation.DoesNotExist:
        return None, Response({"detail": "Not found."}, status=404)


def _create_system_message(conversation, text):
    return Message.objects.create(
        conversation=conversation,
        content=text,
        is_system=True,
        sender=None,
        sender_name_override="System",
        status="seen",
    )


# ── Conversations ─────────────────────────────────────────────────────────────

class ConversationListView(APIView):
    """
    GET  /chat/conversations/  — list all conversations the user belongs to
    """

    def get(self, request):
        conv_ids = ConversationParticipant.objects.filter(
            user=request.user, left_at__isnull=True
        ).values_list("conversation_id", flat=True)

        conversations = (
            Conversation.objects.filter(id__in=conv_ids)
            .prefetch_related(
                "participants__user__presence",
                "participants__user__department",
                "messages",
            )
            .order_by("-updated_at")
        )

        serializer = ConversationSerializer(
            conversations, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ConversationDetailView(APIView):
    """GET /chat/conversations/<id>/"""

    def get(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err
        return Response(ConversationSerializer(conv, context={"request": request}).data)


class CreateDirectConversationView(APIView):
    """POST /chat/conversations/direct/  { recipient_id }"""

    def post(self, request):
        recipient_id = request.data.get("recipient_id")
        if not recipient_id:
            return Response({"detail": "recipient_id required."}, status=400)

        try:
            recipient = User.objects.get(pk=recipient_id, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if recipient == request.user:
            return Response({"detail": "Cannot start a conversation with yourself."}, status=400)

        # Find existing DM between the two users
        existing = (
            Conversation.objects.filter(type="direct")
            .filter(participants__user=request.user)
            .filter(participants__user=recipient)
            .first()
        )
        if existing:
            return Response(
                ConversationSerializer(existing, context={"request": request}).data,
                status=200,
            )

        with transaction.atomic():
            conv = Conversation.objects.create(type="direct", created_by=request.user)
            ConversationParticipant.objects.bulk_create([
                ConversationParticipant(conversation=conv, user=request.user),
                ConversationParticipant(conversation=conv, user=recipient),
            ])

        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=201,
        )


class CreateGroupConversationView(APIView):
    """
    POST /chat/conversations/groups/
    Body: { name, description?, participant_ids: [] }
    Only GROUP_ADMIN_ROLES can create groups.
    """

    def post(self, request):
        user = request.user
        name = request.data.get("name", "").strip()
        description = request.data.get("description", "").strip()
        participant_ids = request.data.get("participant_ids", [])

        # Audit denied attempts
        if user.role not in GROUP_ADMIN_ROLES:
            ChatAuditLog.objects.create(
                action="group_creation_denied",
                performed_by=user,
                group_name=name,
                reason="Insufficient permissions",
            )
            return Response(
                {"detail": "Only admins can create groups."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not name:
            return Response({"detail": "name is required."}, status=400)

        if not participant_ids:
            return Response({"detail": "Add at least one member."}, status=400)

        members = User.objects.filter(pk__in=participant_ids, is_active=True)

        with transaction.atomic():
            conv = Conversation.objects.create(
                type="group",
                name=f"#{name.lower().replace(' ', '-')}",
                description=description,
                created_by=user,
            )
            # Creator is also a participant + admin
            participants_to_create = [
                ConversationParticipant(conversation=conv, user=user, is_admin=True)
            ]
            for member in members:
                if member != user:
                    participants_to_create.append(
                        ConversationParticipant(conversation=conv, user=member)
                    )
            ConversationParticipant.objects.bulk_create(participants_to_create, ignore_conflicts=True)

            _create_system_message(conv, f'Group "{name}" created by {user.get_full_name()}')

            ChatAuditLog.objects.create(
                action="group_created",
                performed_by=user,
                conversation=conv,
                group_name=name,
            )

        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=201,
        )


class UpdateGroupView(APIView):
    """PATCH /chat/conversations/<id>/"""

    def patch(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        if conv.type != "group":
            return Response({"detail": "Not a group."}, status=400)

        participant = conv.participants.filter(user=request.user).first()
        if not participant or not participant.is_admin:
            return Response({"detail": "Only group admins can update group info."}, status=403)

        allowed_fields = {"name", "description"}
        for field in allowed_fields:
            if field in request.data:
                setattr(conv, field, request.data[field])
        conv.save()

        ChatAuditLog.objects.create(
            action="group_updated",
            performed_by=request.user,
            conversation=conv,
            group_name=conv.name,
        )

        return Response(ConversationSerializer(conv, context={"request": request}).data)


class LeaveGroupView(APIView):
    """POST /chat/conversations/<id>/leave/"""

    def post(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        if conv.type != "group":
            return Response({"detail": "Can only leave group conversations."}, status=400)

        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.left_at = timezone.now()
            participant.save(update_fields=["left_at"])

        _create_system_message(conv, f"{request.user.get_full_name()} left the group.")
        return Response({"detail": "Left group."})


# ── Messages ──────────────────────────────────────────────────────────────────

class MessageListView(APIView):
    """
    GET  /chat/conversations/<id>/messages/  — paginated message history
    POST /chat/conversations/<id>/messages/  — send message
    """

    def get(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))

        messages = (
            conv.messages.filter(is_deleted=False)
            .select_related("sender", "reply_to")
            .prefetch_related("media", "call")
            .order_by("created_at")[offset: offset + limit]
        )

        serializer = MessageSerializer(messages, many=True, context={"request": request})
        total = conv.messages.filter(is_deleted=False).count()
        return Response({"count": total, "results": serializer.data})

    def post(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        content = request.data.get("content", "").strip()
        media_ids = request.data.get("media_ids", [])

        if not content and not media_ids:
            return Response({"detail": "content or media_ids required."}, status=400)

        with transaction.atomic():
            msg = Message.objects.create(
                conversation=conv,
                sender=request.user,
                content=content,
                status="sent",
            )

            if media_ids:
                ChatMedia.objects.filter(
                    id__in=media_ids,
                    conversation=conv,
                    message__isnull=True,
                ).update(message=msg)

            # Touch conversation updated_at so it sorts to top
            Conversation.objects.filter(pk=conv.pk).update(updated_at=timezone.now())

        serializer = MessageSerializer(msg, context={"request": request})
        return Response(serializer.data, status=201)


class MarkReadView(APIView):
    """POST /chat/conversations/<id>/read/"""

    def post(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.last_read_at = timezone.now()
            participant.save(update_fields=["last_read_at"])

        return Response({"detail": "Marked as read."})


class UpdateMessageStatusView(APIView):
    """PATCH /chat/messages/<id>/"""

    def patch(self, request, pk):
        try:
            msg = Message.objects.get(pk=pk)
        except Message.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        # Only the sender can mark; or participants can mark delivered/seen
        new_status = request.data.get("status")
        valid_statuses = [s[0] for s in Message.STATUS]
        if new_status not in valid_statuses:
            return Response({"detail": f"Invalid status. Choices: {valid_statuses}"}, status=400)

        msg.status = new_status
        msg.save(update_fields=["status"])
        return Response(MessageSerializer(msg, context={"request": request}).data)


# ── Media ─────────────────────────────────────────────────────────────────────

class MediaUploadView(APIView):
    """POST /chat/media/  (multipart)"""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        conversation_id = request.data.get("conversation_id")

        if not file:
            return Response({"detail": "file required."}, status=400)
        if not conversation_id:
            return Response({"detail": "conversation_id required."}, status=400)

        conv, err = _get_conversation_or_404(conversation_id, request.user)
        if err:
            return err

        mime = file.content_type or ""
        if mime.startswith("image/"):
            media_type = "image"
        elif mime.startswith("video/"):
            media_type = "video"
        elif mime.startswith("audio/"):
            media_type = "audio"
        else:
            media_type = "document"

        media = ChatMedia.objects.create(
            conversation=conv,
            uploaded_by=request.user,
            file=file,
            name=file.name,
            size=file.size,
            mime_type=mime,
            media_type=media_type,
        )

        return Response(
            ChatMediaSerializer(media, context={"request": request}).data,
            status=201,
        )


class SharedMediaView(APIView):
    """GET /chat/conversations/<id>/media/"""

    def get(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        media = conv.shared_media.select_related("uploaded_by").order_by("-created_at")
        return Response(
            ChatMediaSerializer(media, many=True, context={"request": request}).data
        )


# ── Presence ──────────────────────────────────────────────────────────────────

class OnlineUsersView(APIView):
    """GET /chat/presence/online/  — all online users in same org"""

    def get(self, request):
        org = request.user.organisation
        presences = (
            UserPresence.objects.filter(
                status="online", user__organisation=org, user__is_active=True
            )
            .select_related("user")
            .exclude(user=request.user)
        )
        return Response(PresenceSerializer(presences, many=True).data)


class UpdatePresenceView(APIView):
    """POST /chat/presence/  { status: 'online'|'away'|'offline' }"""

    def post(self, request):
        status_val = request.data.get("status", "online")
        if status_val not in ("online", "away", "offline"):
            return Response({"detail": "Invalid status."}, status=400)

        presence, _ = UserPresence.objects.get_or_create(user=request.user)
        presence.status = status_val
        if status_val != "online":
            presence.last_seen = timezone.now()
        presence.save()

        return Response(PresenceSerializer(presence).data)


# ── Calls ─────────────────────────────────────────────────────────────────────

class InitiateCallView(APIView):
    """POST /chat/calls/  { recipient_id, type, conversation_id }"""

    def post(self, request):
        ser = CallCreateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        vd = ser.validated_data
        conv, err = _get_conversation_or_404(vd["conversation_id"], request.user)
        if err:
            return err

        try:
            recipient = User.objects.get(pk=vd["recipient_id"], is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "Recipient not found."}, status=404)

        with transaction.atomic():
            # Create a message bubble for the call
            msg = Message.objects.create(
                conversation=conv,
                sender=request.user,
                content="",
                status="sent",
            )
            call = Call.objects.create(
                conversation=conv,
                initiator=request.user,
                recipient=recipient,
                call_type=vd["type"],
                status="ringing",
                message=msg,
            )

        from .serializers import CallRecordSerializer
        return Response(CallRecordSerializer(call).data, status=201)


class EndCallView(APIView):
    """PATCH /chat/calls/<id>/  { status, duration? }"""

    def patch(self, request, pk):
        try:
            call = Call.objects.get(pk=pk)
        except Call.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if call.initiator != request.user and call.recipient != request.user:
            return Response({"detail": "Forbidden."}, status=403)

        ser = CallEndSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        call.status = ser.validated_data["status"]
        call.ended_at = timezone.now()
        if "duration" in ser.validated_data:
            call.duration = ser.validated_data["duration"]
        call.save()

        from .serializers import CallRecordSerializer
        return Response(CallRecordSerializer(call).data)


class CallHistoryView(APIView):
    """GET /chat/conversations/<id>/calls/"""

    def get(self, request, pk):
        conv, err = _get_conversation_or_404(pk, request.user)
        if err:
            return err

        calls = conv.calls.select_related("initiator", "recipient").order_by("-started_at")
        from .serializers import CallRecordSerializer
        return Response(CallRecordSerializer(calls, many=True).data)


# ── Unread Count ──────────────────────────────────────────────────────────────

class UnreadCountView(APIView):
    """GET /chat/unread-count/"""

    def get(self, request):
        conv_ids = ConversationParticipant.objects.filter(
            user=request.user, left_at__isnull=True
        ).values_list("conversation_id", flat=True)

        total = 0
        for conv in Conversation.objects.filter(id__in=conv_ids):
            total += conv.get_unread_count(request.user)

        return Response({"unread": total})


# ── Audit Logs ────────────────────────────────────────────────────────────────

class AuditLogView(APIView):
    """GET /chat/audit-logs/  (admin only)"""

    def get(self, request):
        if request.user.role not in GROUP_ADMIN_ROLES:
            return Response({"detail": "Forbidden."}, status=403)

        logs = ChatAuditLog.objects.select_related("performed_by", "conversation").filter(
            Q(performed_by__organisation=request.user.organisation)
            | Q(performed_by__isnull=True)
        )

        action = request.query_params.get("action")
        if action:
            logs = logs.filter(action=action)

        serializer = ChatAuditLogSerializer(logs[:100], many=True)
        return Response(serializer.data)