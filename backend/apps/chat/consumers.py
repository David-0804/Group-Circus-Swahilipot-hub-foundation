"""
Nexus Chat — WebSocket Consumer
Handles: messages, typing indicators, presence, call signalling
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

logger = logging.getLogger("Nexus")


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Connection URL:  ws://<host>/ws/chat/?token=<jwt>

    Client → Server event types:
        typing          { conversation_id, is_typing }
        message         { conversation_id, content, media_ids? }
        read            { conversation_id }
        presence        { status }
        call_invite     { recipient_id, type, conversation_id }
        call_status     { call_id, status, duration? }

    Server → Client event types:
        message         new message payload
        typing          typing indicator update
        presence        user online/offline change
        call_invite     incoming call notification
        call_status     call status changed
        read_receipt    conversation read by recipient
        error           error payload
    """

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Join a channel group for every active conversation
        self.conversation_groups = await self._get_conversation_groups()
        for group in self.conversation_groups:
            await self.channel_layer.group_add(group, self.channel_name)

        await self.accept()
        await self._set_presence("online")
        await self._broadcast_presence("online")

        logger.info(f"[WS] {self.user.email} connected")

    async def disconnect(self, close_code):
        if not hasattr(self, "user") or not self.user.is_authenticated:
            return

        await self._set_presence("offline")
        await self._broadcast_presence("offline")

        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        for group in getattr(self, "conversation_groups", []):
            await self.channel_layer.group_discard(group, self.channel_name)

        logger.info(f"[WS] {self.user.email} disconnected (code={close_code})")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON")
            return

        event_type = data.get("type")
        payload = data.get("payload", {})

        handlers = {
            "typing":       self._handle_typing,
            "message":      self._handle_message,
            "read":         self._handle_read,
            "presence":     self._handle_presence,
            "call_invite":  self._handle_call_invite,
            "call_status":  self._handle_call_status,
        }

        handler = handlers.get(event_type)
        if handler:
            await handler(payload)
        else:
            await self._send_error(f"Unknown event type: {event_type}")

    # ── Inbound Event Handlers ─────────────────────────────────────────────────

    async def _handle_typing(self, payload):
        conversation_id = str(payload.get("conversation_id", ""))
        is_typing = bool(payload.get("is_typing", False))

        if not await self._is_participant(conversation_id):
            return

        await self.channel_layer.group_send(
            f"conv_{conversation_id}",
            {
                "type": "chat.typing",
                "user_id": str(self.user.id),
                "user_name": self.user.get_full_name(),
                "conversation_id": conversation_id,
                "is_typing": is_typing,
            },
        )

    async def _handle_message(self, payload):
        conversation_id = str(payload.get("conversation_id", ""))
        content = (payload.get("content") or "").strip()
        media_ids = payload.get("media_ids", [])

        if not content and not media_ids:
            await self._send_error("content or media_ids required")
            return

        if not await self._is_participant(conversation_id):
            await self._send_error("Not a participant")
            return

        msg = await self._save_message(conversation_id, content, media_ids)
        if not msg:
            await self._send_error("Could not save message")
            return

        msg_data = await self._serialize_message(msg)

        # Broadcast to the whole conversation group (including sender's other tabs)
        await self.channel_layer.group_send(
            f"conv_{conversation_id}",
            {"type": "chat.message", "message": msg_data},
        )

    async def _handle_read(self, payload):
        conversation_id = str(payload.get("conversation_id", ""))
        if not await self._is_participant(conversation_id):
            return

        await self._mark_read(conversation_id)

        await self.channel_layer.group_send(
            f"conv_{conversation_id}",
            {
                "type": "chat.read_receipt",
                "user_id": str(self.user.id),
                "conversation_id": conversation_id,
            },
        )

    async def _handle_presence(self, payload):
        new_status = payload.get("status", "online")
        if new_status not in ("online", "away", "offline"):
            return
        await self._set_presence(new_status)
        await self._broadcast_presence(new_status)

    async def _handle_call_invite(self, payload):
        recipient_id = str(payload.get("recipient_id", ""))
        call_type = payload.get("type", "voice")
        conversation_id = str(payload.get("conversation_id", ""))

        if not await self._is_participant(conversation_id):
            await self._send_error("Not a participant")
            return

        call = await self._create_call(conversation_id, recipient_id, call_type)
        if not call:
            await self._send_error("Could not create call")
            return

        call_data = {
            "id": str(call["id"]),
            "type": call["call_type"],
            "status": "ringing",
            "initiatorId": str(self.user.id),
            "recipientId": recipient_id,
            "startedAt": call["started_at"],
            "conversationId": conversation_id,
        }

        # Notify the recipient directly
        await self.channel_layer.group_send(
            f"user_{recipient_id}",
            {"type": "chat.call_invite", "call": call_data},
        )
        # Echo back to caller so frontend can update state
        await self.send(text_data=json.dumps({
            "type": "call_invite",
            "payload": call_data,
        }))

    async def _handle_call_status(self, payload):
        call_id = str(payload.get("call_id", ""))
        new_status = payload.get("status")
        duration = payload.get("duration")

        call = await self._update_call(call_id, new_status, duration)
        if not call:
            await self._send_error("Call not found or forbidden")
            return

        status_data = {
            "callId": call_id,
            "status": new_status,
            "duration": duration,
        }

        # Notify both parties
        for uid in [str(call["initiator_id"]), str(call["recipient_id"])]:
            await self.channel_layer.group_send(
                f"user_{uid}",
                {"type": "chat.call_status", "data": status_data},
            )

    # ── Outbound Dispatchers (called by channel_layer.group_send) ─────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "payload": event["message"],
        }))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "payload": {
                "conversationId": event["conversation_id"],
                "userId": event["user_id"],
                "userName": event["user_name"],
                "isTyping": event["is_typing"],
            },
        }))

    async def chat_presence(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "payload": {
                "userId": event["user_id"],
                "isOnline": event["is_online"],
                "status": event["status"],
            },
        }))

    async def chat_read_receipt(self, event):
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "payload": {
                "conversationId": event["conversation_id"],
                "userId": event["user_id"],
            },
        }))

    async def chat_call_invite(self, event):
        await self.send(text_data=json.dumps({
            "type": "call_invite",
            "payload": event["call"],
        }))

    async def chat_call_status(self, event):
        await self.send(text_data=json.dumps({
            "type": "call_status",
            "payload": event["data"],
        }))

    # ── DB Helpers (sync → async wrappers) ────────────────────────────────────

    @database_sync_to_async
    def _get_conversation_groups(self):
        from .models import ConversationParticipant
        ids = ConversationParticipant.objects.filter(
            user=self.user, left_at__isnull=True
        ).values_list("conversation_id", flat=True)
        return [f"conv_{cid}" for cid in ids]

    @database_sync_to_async
    def _is_participant(self, conversation_id):
        from .models import ConversationParticipant
        return ConversationParticipant.objects.filter(
            user=self.user, conversation_id=conversation_id, left_at__isnull=True
        ).exists()

    @database_sync_to_async
    def _save_message(self, conversation_id, content, media_ids):
        from .models import Conversation, Message, ChatMedia
        try:
            conv = Conversation.objects.get(pk=conversation_id)
            msg = Message.objects.create(
                conversation=conv,
                sender=self.user,
                content=content,
                status="sent",
            )
            if media_ids:
                ChatMedia.objects.filter(
                    id__in=media_ids, conversation=conv, message__isnull=True
                ).update(message=msg)
            Conversation.objects.filter(pk=conv.pk).update(updated_at=timezone.now())
            return msg
        except Exception as e:
            logger.error(f"[WS] save_message error: {e}")
            return None

    @database_sync_to_async
    def _serialize_message(self, msg):
        """Return a plain dict suitable for JSON serialization."""
        msg.refresh_from_db()
        media_list = []
        for m in msg.media.all():
            media_list.append({
                "id": str(m.id),
                "type": m.media_type,
                "url": m.file.url if m.file else "",
                "name": m.name,
                "size": m.size,
                "mimeType": m.mime_type,
            })
        return {
            "id": str(msg.id),
            "conversationId": str(msg.conversation_id),
            "senderId": str(msg.sender_id) if msg.sender_id else "system",
            "senderName": msg.sender_name,
            "content": msg.content,
            "timestamp": msg.created_at.isoformat(),
            "status": msg.status,
            "media": media_list,
            "isSystem": msg.is_system,
        }

    @database_sync_to_async
    def _mark_read(self, conversation_id):
        from .models import ConversationParticipant
        ConversationParticipant.objects.filter(
            user=self.user, conversation_id=conversation_id
        ).update(last_read_at=timezone.now())

    @database_sync_to_async
    def _set_presence(self, status):
        from .models import UserPresence
        presence, _ = UserPresence.objects.get_or_create(user=self.user)
        presence.status = status
        if status != "online":
            presence.last_seen = timezone.now()
        presence.save()

    @database_sync_to_async
    def _broadcast_presence(self, status):
        """
        Broadcast presence change to all users in shared conversations.
        We do the DB lookup here; the actual group_send is done in the async caller.
        Returns a list of user_ids to notify.
        """
        from .models import ConversationParticipant
        user_ids = (
            ConversationParticipant.objects.filter(
                conversation__participants__user=self.user,
                left_at__isnull=True,
            )
            .exclude(user=self.user)
            .values_list("user_id", flat=True)
            .distinct()
        )
        return list(user_ids)

    async def _broadcast_presence(self, status):  # noqa: F811 — async override
        user_ids = await self.__broadcast_presence_ids()
        for uid in user_ids:
            await self.channel_layer.group_send(
                f"user_{uid}",
                {
                    "type": "chat.presence",
                    "user_id": str(self.user.id),
                    "is_online": status == "online",
                    "status": status,
                },
            )

    @database_sync_to_async
    def __broadcast_presence_ids(self):
        from .models import ConversationParticipant
        return list(
            ConversationParticipant.objects.filter(
                conversation__participants__user=self.user,
                left_at__isnull=True,
            )
            .exclude(user=self.user)
            .values_list("user_id", flat=True)
            .distinct()
        )

    @database_sync_to_async
    def _create_call(self, conversation_id, recipient_id, call_type):
        from .models import Conversation, Call, Message, User as UserModel
        try:
            conv = Conversation.objects.get(pk=conversation_id)
            recipient = UserModel.objects.get(pk=recipient_id)
            msg = Message.objects.create(
                conversation=conv, sender=self.user, content="", status="sent"
            )
            call = Call.objects.create(
                conversation=conv,
                initiator=self.user,
                recipient=recipient,
                call_type=call_type,
                status="ringing",
                message=msg,
            )
            return {
                "id": call.id,
                "call_type": call.call_type,
                "started_at": call.started_at.isoformat(),
                "initiator_id": call.initiator_id,
                "recipient_id": call.recipient_id,
            }
        except Exception as e:
            logger.error(f"[WS] create_call error: {e}")
            return None

    @database_sync_to_async
    def _update_call(self, call_id, new_status, duration):
        from .models import Call
        try:
            call = Call.objects.get(pk=call_id)
            if call.initiator != self.user and call.recipient != self.user:
                return None
            call.status = new_status
            call.ended_at = timezone.now()
            if duration is not None:
                call.duration = duration
            call.save()
            return {"initiator_id": call.initiator_id, "recipient_id": call.recipient_id}
        except Call.DoesNotExist:
            return None

    # ── Utils ─────────────────────────────────────────────────────────────────

    async def _send_error(self, detail):
        await self.send(text_data=json.dumps({
            "type": "error",
            "payload": {"detail": detail},
        }))