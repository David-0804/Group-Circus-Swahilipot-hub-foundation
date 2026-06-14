"""
apps/chat/views.py — Fixed version
Key fixes:
- ConversationListView wraps serializer in try/except so one bad row doesn't 500 the whole list
- UpdatePresenceView uses get+save instead of get_or_create to avoid updated_at null bug
- All views handle missing related objects gracefully
"""
import mimetypes
import logging
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    Conversation, ConversationMember, ChatMedia,
    Message, MessageReceipt, UserPresence, Call, GroupAuditLog,
)
from .serializers import (
    ConversationSerializer, MessageSerializer, ChatMediaSerializer,
    CallSerializer, PresenceSerializer, AuditLogSerializer,
    SendMessageSerializer, CreateDirectSerializer, CreateGroupSerializer,
    UpdatePresenceSerializer, InitiateCallSerializer, EndCallSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)

ADMIN_ROLES = {"system_admin", "broadcast_admin", "hr_officer", "executive"}


def is_chat_admin(user):
    return getattr(user, "role", "") in ADMIN_ROLES or user.is_superuser


# ── Conversations ─────────────────────────────────────────────────────────────

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            conv_ids = ConversationMember.objects.filter(
                user=request.user
            ).values_list("conversation_id", flat=True)

            conversations = Conversation.objects.filter(
                id__in=conv_ids
            ).prefetch_related(
                "members__user",
                "members__user__presence",
                "messages",
            ).order_by("-updated_at")

            # Serialize each conversation individually so one error doesn't crash the list
            results = []
            for conv in conversations:
                try:
                    data = ConversationSerializer(conv, context={"request": request}).data
                    results.append(data)
                except Exception as e:
                    logger.error(f"Error serializing conversation {conv.id}: {e}")
                    continue

            return Response(results)

        except Exception as e:
            logger.error(f"ConversationListView error: {e}", exc_info=True)
            return Response({"detail": str(e)}, status=500)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_conv(self, conv_id, user):
        try:
            return Conversation.objects.prefetch_related(
                "members__user", "members__user__presence"
            ).get(id=conv_id, members__user=user)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, conv_id):
        conv = self._get_conv(conv_id, request.user)
        if not conv:
            return Response({"detail": "Not found."}, status=404)
        return Response(ConversationSerializer(conv, context={"request": request}).data)

    def patch(self, request, conv_id):
        conv = self._get_conv(conv_id, request.user)
        if not conv or conv.type != "group":
            return Response({"detail": "Not found."}, status=404)
        if not is_chat_admin(request.user):
            return Response({"detail": "Only admins can update groups."}, status=403)
        if name := request.data.get("name"):
            conv.name = name
        if (desc := request.data.get("description")) is not None:
            conv.description = desc
        conv.save(update_fields=["name", "description", "updated_at"])
        return Response(ConversationSerializer(conv, context={"request": request}).data)


class LeaveConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conv_id):
        deleted, _ = ConversationMember.objects.filter(
            conversation_id=conv_id, user=request.user
        ).delete()
        if not deleted:
            return Response({"detail": "Not a member."}, status=400)
        return Response({"detail": "Left conversation."})


class CreateDirectConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateDirectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient_id = serializer.validated_data["recipient_id"]

        try:
            recipient = User.objects.get(id=recipient_id, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if str(recipient.id) == str(request.user.id):
            return Response({"detail": "Cannot DM yourself."}, status=400)

        existing = (
            Conversation.objects.filter(type="direct")
            .filter(members__user=request.user)
            .filter(members__user=recipient)
            .first()
        )
        if existing:
            return Response(
                ConversationSerializer(existing, context={"request": request}).data
            )

        with transaction.atomic():
            conv = Conversation.objects.create(type="direct", created_by=request.user)
            ConversationMember.objects.create(conversation=conv, user=request.user)
            ConversationMember.objects.create(conversation=conv, user=recipient)

        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=201,
        )


class CreateGroupConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateGroupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        allowed = is_chat_admin(request.user)

        log_kwargs = dict(
            action="create_group",
            actor=request.user,
            actor_role=getattr(request.user, "role", ""),
            group_name=data["name"],
        )

        if not allowed:
            GroupAuditLog.objects.create(
                **log_kwargs, success=False, detail="Access denied: insufficient role."
            )
            return Response({"detail": "Only admins can create groups."}, status=403)

        members = User.objects.filter(id__in=data["participant_ids"], is_active=True)

        with transaction.atomic():
            conv = Conversation.objects.create(
                type="group",
                name=data["name"],
                description=data.get("description", ""),
                created_by=request.user,
            )
            ConversationMember.objects.create(
                conversation=conv, user=request.user, is_admin=True
            )
            for member in members:
                if member.id != request.user.id:
                    ConversationMember.objects.get_or_create(
                        conversation=conv, user=member
                    )
            name_str = f"{request.user.first_name or ''} {request.user.last_name or ''}".strip()
            Message.objects.create(
                conversation=conv,
                sender=request.user,
                content=f"{name_str or request.user.email} created the group.",
                is_system=True,
            )
            GroupAuditLog.objects.create(
                **log_kwargs,
                success=True,
                conversation=conv,
                detail=f"Created with {members.count() + 1} members.",
            )

        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=201,
        )


# ── Messages ──────────────────────────────────────────────────────────────────

class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def _is_member(self, conv_id, user):
        return ConversationMember.objects.filter(
            conversation_id=conv_id, user=user
        ).exists()

    def get(self, request, conv_id):
        if not self._is_member(conv_id, request.user):
            return Response({"detail": "Not a member."}, status=403)

        limit = int(request.query_params.get("limit", 50))
        before = request.query_params.get("before")

        qs = Message.objects.filter(
            conversation_id=conv_id
        ).select_related("sender").prefetch_related("media", "call_record")

        if before:
            qs = qs.filter(created_at__lt=before)

        messages = list(reversed(list(qs.order_by("-created_at")[:limit])))

        now = timezone.now()
        for msg in messages:
            if msg.sender_id != request.user.id:
                MessageReceipt.objects.update_or_create(
                    message=msg, user=request.user,
                    defaults={"delivered_at": now},
                )

        return Response({
            "results": MessageSerializer(
                messages, many=True, context={"request": request}
            ).data,
            "count": len(messages),
        })

    def post(self, request, conv_id):
        if not self._is_member(conv_id, request.user):
            return Response({"detail": "Not a member."}, status=403)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if not data["content"] and not data["media_ids"]:
            return Response({"detail": "Message must have content or media."}, status=400)

        with transaction.atomic():
            msg = Message.objects.create(
                conversation_id=conv_id,
                sender=request.user,
                content=data["content"],
                status="sent",
            )
            if data["media_ids"]:
                media_qs = ChatMedia.objects.filter(
                    id__in=data["media_ids"],
                    conversation_id=conv_id,
                    uploaded_by=request.user,
                )
                msg.media.set(media_qs)
            Conversation.objects.filter(id=conv_id).update(updated_at=timezone.now())

        return Response(
            MessageSerializer(msg, context={"request": request}).data,
            status=201,
        )


class UpdateMessageStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, msg_id):
        try:
            msg = Message.objects.get(id=msg_id)
        except Message.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        new_status = request.data.get("status")
        if new_status not in ("sent", "delivered", "seen"):
            return Response({"detail": "Invalid status."}, status=400)
        if msg.sender_id == request.user.id:
            return Response({"detail": "Cannot update own message status."}, status=400)

        now = timezone.now()
        receipt, _ = MessageReceipt.objects.get_or_create(message=msg, user=request.user)
        if new_status == "delivered" and not receipt.delivered_at:
            receipt.delivered_at = now
        if new_status == "seen":
            receipt.delivered_at = receipt.delivered_at or now
            receipt.seen_at = now
        receipt.save()

        STATUS_ORDER = {"sent": 0, "delivered": 1, "seen": 2}
        if STATUS_ORDER.get(new_status, 0) > STATUS_ORDER.get(msg.status, 0):
            msg.status = new_status
            msg.save(update_fields=["status", "updated_at"])

        return Response(MessageSerializer(msg, context={"request": request}).data)


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conv_id):
        member = ConversationMember.objects.filter(
            conversation_id=conv_id, user=request.user
        ).first()
        if not member:
            return Response({"detail": "Not a member."}, status=403)

        now = timezone.now()
        member.last_read_at = now
        member.save(update_fields=["last_read_at"])

        Message.objects.filter(
            conversation_id=conv_id
        ).exclude(sender=request.user).exclude(status="seen").update(status="seen")

        return Response({"detail": "Marked as read.", "read_at": now.isoformat()})


# ── Media ─────────────────────────────────────────────────────────────────────

class UploadMediaView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        conv_id = request.data.get("conversation_id")
        if not file:
            return Response({"detail": "No file provided."}, status=400)
        if not ConversationMember.objects.filter(
            conversation_id=conv_id, user=request.user
        ).exists():
            return Response({"detail": "Not a member."}, status=403)

        mime = file.content_type or mimetypes.guess_type(file.name)[0] or ""
        if mime.startswith("image/"):
            media_type = "image"
        elif mime.startswith("video/"):
            media_type = "video"
        elif mime.startswith("audio/"):
            media_type = "audio"
        else:
            media_type = "document"

        media = ChatMedia.objects.create(
            conversation_id=conv_id,
            uploaded_by=request.user,
            file=file,
            original_name=file.name,
            media_type=media_type,
            mime_type=mime,
            size=file.size,
        )
        return Response(
            ChatMediaSerializer(media, context={"request": request}).data,
            status=201,
        )


class SharedMediaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conv_id):
        if not ConversationMember.objects.filter(
            conversation_id=conv_id, user=request.user
        ).exists():
            return Response({"detail": "Not a member."}, status=403)
        media = ChatMedia.objects.filter(conversation_id=conv_id).order_by("-created_at")
        if t := request.query_params.get("type"):
            media = media.filter(media_type=t)
        return Response({
            "results": ChatMediaSerializer(
                media, many=True, context={"request": request}
            ).data,
            "count": media.count(),
        })


# ── Presence ──────────────────────────────────────────────────────────────────

class OnlineUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        presences = UserPresence.objects.filter(
            status="online"
        ).select_related("user")
        result = []
        for p in presences:
            u = p.user
            try:
                full = f"{u.first_name or ''} {u.last_name or ''}".strip()
                result.append({
                    "id": str(u.id),
                    "name": full or u.email,
                    "role": getattr(u, "role", ""),
                    "email": u.email,
                    "isOnline": True,
                })
            except Exception:
                continue
        return Response(result)


class UpdatePresenceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UpdatePresenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        try:
            # Try to get existing record and update it
            presence = UserPresence.objects.get(user=request.user)
            presence.status = new_status
            presence.save()  # auto_now fields handle updated_at and last_seen
        except UserPresence.DoesNotExist:
            # Create fresh — auto_now handles timestamps
            presence = UserPresence(user=request.user, status=new_status)
            presence.save()

        return Response(PresenceSerializer(presence).data)


# ── Calls ─────────────────────────────────────────────────────────────────────

class InitiateCallView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiateCallSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            recipient = User.objects.get(id=data["recipient_id"], is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "Recipient not found."}, status=404)

        if not ConversationMember.objects.filter(
            conversation_id=data["conversation_id"], user=request.user
        ).exists():
            return Response({"detail": "Not a member."}, status=403)

        with transaction.atomic():
            call = Call.objects.create(
                conversation_id=data["conversation_id"],
                initiator=request.user,
                recipient=recipient,
                call_type=data["type"],
                status="ringing",
            )
            Message.objects.create(
                conversation_id=data["conversation_id"],
                sender=request.user,
                content="",
                is_system=True,
                call_record=call,
            )

        return Response(CallSerializer(call).data, status=201)


class EndCallView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, call_id):
        try:
            call = Call.objects.get(id=call_id)
        except Call.DoesNotExist:
            return Response({"detail": "Call not found."}, status=404)

        if request.user not in (call.initiator, call.recipient):
            return Response({"detail": "Not a participant."}, status=403)

        serializer = EndCallSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        now = timezone.now()
        call.status = data["status"]
        call.ended_at = now
        if data.get("duration") is not None:
            call.duration = data["duration"]
        elif call.connected_at:
            call.duration = int((now - call.connected_at).total_seconds())
        call.save()

        return Response(CallSerializer(call).data)


class CallHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conv_id):
        if not ConversationMember.objects.filter(
            conversation_id=conv_id, user=request.user
        ).exists():
            return Response({"detail": "Not a member."}, status=403)
        calls = Call.objects.filter(
            conversation_id=conv_id
        ).select_related("initiator", "recipient").order_by("-started_at")
        return Response(CallSerializer(calls, many=True).data)


# ── Unread / Audit ────────────────────────────────────────────────────────────

class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = 0
        try:
            memberships = ConversationMember.objects.filter(
                user=request.user
            ).select_related("conversation")
            for m in memberships:
                qs = m.conversation.messages.exclude(sender=request.user)
                if m.last_read_at:
                    qs = qs.filter(created_at__gt=m.last_read_at)
                total += qs.count()
        except Exception as e:
            logger.error(f"UnreadCountView error: {e}")
        return Response({"count": total})


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_chat_admin(request.user):
            return Response({"detail": "Admins only."}, status=403)
        logs = GroupAuditLog.objects.select_related(
            "actor", "conversation"
        ).order_by("-created_at")[:200]
        return Response(AuditLogSerializer(logs, many=True).data)
