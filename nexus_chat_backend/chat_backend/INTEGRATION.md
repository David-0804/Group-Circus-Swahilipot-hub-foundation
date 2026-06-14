# Nexus Chat Backend — Integration Guide

## File structure delivered

```
chat/
├── __init__.py
├── apps.py
├── models.py              ← All DB models
├── serializers.py         ← DRF serializers (matches chatStore.ts types)
├── views.py               ← All 20 API endpoints
├── urls.py                ← URL routing
├── consumers.py           ← Django Channels WebSocket consumer
├── admin.py               ← Django admin
├── asgi.py                ← Drop-in Nexus/asgi.py replacement
├── settings_additions.py  ← Blocks to merge into settings.py
├── project_urls_snippet.py← Snippet to merge into Nexus/urls.py
└── migrations/
    ├── __init__.py
    └── 0001_initial.py    ← Full initial migration
```

---

## Step 1 — Install dependencies

```bash
pip install channels channels-redis djangorestframework
# Redis must be running: sudo systemctl start redis
```

For dev without Redis (in-memory, single-process only):
```bash
pip install channels
# then use the InMemoryChannelLayer option in settings (see below)
```

---

## Step 2 — Copy the chat app

```bash
cp -r chat/ /path/to/your/project/
```

---

## Step 3 — settings.py

Add to **INSTALLED_APPS**:
```python
INSTALLED_APPS = [
    ...
    "channels",
    "chat",
]
```

Add channel layer + ASGI + media (see `chat/settings_additions.py` for full blocks):
```python
ASGI_APPLICATION = "Nexus.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
    }
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
```

---

## Step 4 — Nexus/asgi.py

Replace your existing `Nexus/asgi.py` with `chat/asgi.py` (or copy its contents):

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Nexus.settings")
django_asgi_app = get_asgi_application()

from chat.consumers import ChatConsumer

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter([re_path(r"^ws/chat/$", ChatConsumer.as_asgi())])
    ),
})
```

---

## Step 5 — Nexus/urls.py

Add to your `urlpatterns`:
```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    ...
    path("chat/", include("chat.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## Step 6 — Migrate

```bash
python manage.py migrate chat
```

---

## Step 7 — Run with Daphne (replaces Gunicorn for WS support)

```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 Nexus.asgi:application
```

Or with uvicorn:
```bash
pip install uvicorn
uvicorn Nexus.asgi:application --host 0.0.0.0 --port 8000
```

---

## API Reference

All endpoints require `Authorization: Bearer <jwt>` header.

### Conversations

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/chat/conversations/` | List user's conversations |
| `POST` | `/chat/conversations/direct/` | Start or get DM. Body: `{recipient_id}` |
| `POST` | `/chat/conversations/groups/` | Create group (admin only). Body: `{name, description?, participant_ids[]}` |
| `GET` | `/chat/conversations/<id>/` | Get single conversation |
| `PATCH` | `/chat/conversations/<id>/` | Update group name/description (admin only) |
| `POST` | `/chat/conversations/<id>/leave/` | Leave a conversation |

### Messages

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/chat/conversations/<id>/messages/` | List messages. Query: `?limit=50&before=<iso>` |
| `POST` | `/chat/conversations/<id>/messages/` | Send message. Body: `{content, media_ids?[]}` |
| `POST` | `/chat/conversations/<id>/read/` | Mark all messages read |
| `PATCH` | `/chat/messages/<id>/` | Update delivery status. Body: `{status}` |

### Media

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/chat/media/` | Upload file. Form: `file`, `conversation_id` |
| `GET` | `/chat/conversations/<id>/media/` | Shared media. Query: `?type=image\|document\|video\|audio` |

### Presence

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/chat/presence/online/` | List online users |
| `POST` | `/chat/presence/` | Update own status. Body: `{status: "online"\|"away"\|"offline"}` |

### Calls

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/chat/calls/` | Initiate call. Body: `{recipient_id, type, conversation_id}` |
| `PATCH` | `/chat/calls/<id>/` | End/decline call. Body: `{status, duration?}` |
| `GET` | `/chat/conversations/<id>/calls/` | Call history |

### Utility

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/chat/unread-count/` | Total unread count |
| `GET` | `/chat/audit-logs/` | Group creation audit log (admin only) |

---

## WebSocket

Connect: `ws://<host>/ws/chat/?token=<jwt_access_token>`

### Client → Server events

```json
// Typing indicator
{"type": "typing", "payload": {"conversation_id": "...", "is_typing": true}}

// Send message (prefer REST POST for reliability)
{"type": "message", "payload": {"conversation_id": "...", "content": "Hello"}}

// Presence update
{"type": "presence", "payload": {"status": "away"}}

// Call status change
{"type": "call_status", "payload": {"call_id": "...", "status": "ended", "conversation_id": "..."}}
```

### Server → Client events

```json
{"type": "typing",       "payload": {"conversation_id": "...", "user_id": "...", "is_typing": true}}
{"type": "message",      "payload": { /* MessageSerializer output */ }}
{"type": "presence",     "payload": {"user_id": "...", "is_online": true}}
{"type": "call_invite",  "payload": { /* CallSerializer output */ }}
{"type": "call_status",  "payload": {"call_id": "...", "status": "connected", "user_id": "..."}}
```

---

## Role → Permission Map

| Role | Create Group | View Audit Logs | Update Group |
|------|-------------|-----------------|--------------|
| `system_admin` | ✅ | ✅ | ✅ |
| `broadcast_admin` | ✅ | ✅ | ✅ |
| `hr_officer` | ✅ | ✅ | ✅ |
| `executive` | ✅ | ✅ | ✅ |
| All others | ❌ | ❌ | ❌ |

---

## chatApi.ts — No changes needed

The existing `chatApi.ts` in the frontend works as-is. Every URL, method,
and payload shape it calls is implemented by this backend. The `ChatWebSocket`
class in `chatApi.ts` connects to `ws://<host>/ws/chat/?token=<token>` which
maps to the `ChatConsumer` above.

---

## Data flow: sending a message

```
Frontend (MessageThread.tsx)
  └─ sendMessage() in chatStore.ts (optimistic UI update)
       └─ chatApi.sendMessage() → POST /chat/conversations/<id>/messages/
            └─ SendMessageView.post()
                 ├─ validates membership
                 ├─ creates Message row
                 ├─ links media if provided
                 └─ returns MessageSerializer payload
                      └─ chatStore updates messages[convId]
                           └─ React re-renders thread

Simultaneously (WebSocket):
  Server broadcasts "message" event to chat_conv_<id> group
    └─ All other members' ChatConsumer.chat_message() fires
         └─ Their frontend chatStore receives WS event → updates UI
```

---

## Notes on the existing codebase

- `useAuthStore` / `api.ts` — unchanged; chat uses the same JWT interceptor
- `accounts_user` table — `id` (UUID), `role`, `first_name`, `last_name`,
  `email`, `department_id` are all read by the serializers
- No new CSS required; all chat components use existing Nexus CSS variables
- The `ChatPanel` floating button and `ChatTopbarButton` badge both read
  from `useChatStore.getTotalUnread()` which can be wired to poll
  `GET /chat/unread-count/` on a 30-second interval
