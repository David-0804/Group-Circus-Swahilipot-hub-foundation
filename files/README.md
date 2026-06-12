# Nexus Enterprise Chat System

A WhatsApp-style embedded chat module for the Nexus Enterprise dashboard.  
Matches the dark theme, integrates seamlessly with the existing `AppLayout`, and preserves all analytics panels.

---

## File Structure

```
src/
├── components/
│   └── chat/
│       ├── AppLayout.tsx          ← Updated AppLayout (replace existing)
│       ├── ChatPanel.tsx          ← Main collapsible chat panel
│       ├── ChatTopbarButton.tsx   ← Topbar icon with unread badge
│       ├── ConversationList.tsx   ← Left sidebar: groups + DMs
│       ├── MessageThread.tsx      ← Center: messages, media, calls
│       ├── ContactProfile.tsx     ← Right: profile + shared media
│       ├── ActiveCallOverlay.tsx  ← Floating call UI
│       ├── CreateGroupModal.tsx   ← Admin-only group creation modal
│       └── index.ts               ← Barrel exports
├── services/
│   └── chatApi.ts                 ← Backend API endpoints + WebSocket helper
└── stores/
    └── chatStore.ts               ← Zustand store (state + actions)
```

---

## Integration Steps

### 1. Install dependencies (already in project)
```bash
# All dependencies are already used by Nexus:
# zustand, clsx, lucide-react, @tanstack/react-query
```

### 2. Copy files
Place the `chat/` folder inside `src/components/` and the store/service files in their respective directories.

### 3. Replace AppLayout
Replace `src/components/layout/AppLayout.tsx` with the new `AppLayout.tsx` from this package.  
The only changes are:
- Import `ChatPanel` and `ChatTopbarButton`  
- Add `<ChatTopbarButton />` to the topbar (next to the Bell icon)  
- Add `<ChatPanel />` at the bottom of the layout (outside the main scroll area)

### 4. Alias path (optional)
If using path aliases, ensure `../../services/api` resolves to your existing `api.ts` where `useAuthStore` lives.

---

## Features

### Chat Panel
- **Collapsible** — floating button at bottom-right; expands to 780×600px panel or full-screen
- **Preserves analytics** — all dashboard panels remain visible; chat overlays the right side only

### Conversation List (Left Sidebar)
| Feature | Detail |
|---|---|
| Chat Groups | Expandable section with `#channel` style groups |
| Direct Chats | Shows existing DM threads with online/offline indicator |
| Start new DM | Lists all online users; click to open or create conversation |
| Unread badges | Red count badges on conversations |
| Search | Filters groups and DMs by name |

### Message Thread (Center)
| Feature | Detail |
|---|---|
| Message bubbles | Alternating mine/theirs, grouped by sender |
| Timestamps | Per-group timestamp + sender name (groups) |
| Delivery status | Sending → Sent → Delivered → Seen (✓✓ in blue) |
| Typing indicator | Animated dots + "Name is typing…" |
| Media | Images, video, audio, documents with preview/icon |
| File attach | Paperclip icon → native file picker |
| Voice call | Phone button → call overlay with mute |
| Video call | Camera button → call overlay with mute + video toggle |
| Call history | Missed/ended calls appear as chat bubbles |

### Contact Profile (Right Panel)
Shows (per spec — no DOB or phone):
- Avatar with online indicator
- Name, Role, Department, Email
- Shared Media tab (All / Images / Docs) with file list

### Active Call Overlay
- Floating card (top-right of screen)
- Shows contact name, call status (Ringing / Connected)
- Animated dots while ringing
- Mute, end call, video-off controls

### Group Creation (Admin Only)
| Layer | Behaviour |
|---|---|
| UI | "+" button next to Chat Groups only visible to admins |
| Modal | Shows admin badge; blocked with shield error for non-admins |
| Store | `createGroup()` rejects with "Only admins can create groups." |
| Audit log | Every attempt (success or denied) logged with creator ID + timestamp |

### Direct Messages
- Shows presence (green = online, grey = offline)
- Click online user → opens existing thread or creates new one
- Conversations identified by participant pair (no duplicates)
- Messages stored with timestamp, senderId, status

---

## Role → Permission Map

| Role | Create Group |
|---|---|
| `system_admin` | ✅ |
| `broadcast_admin` | ✅ |
| `hr_officer` | ✅ |
| `executive` | ✅ |
| All other roles | ❌ |

---

## Backend Endpoints (chatApi.ts)

All endpoints follow the existing `api.ts` pattern (Axios + JWT interceptor):

```
GET  /chat/conversations/              — list conversations
POST /chat/conversations/direct/       — start DM
POST /chat/conversations/groups/       — create group (admin)
GET  /chat/conversations/:id/messages/ — list messages
POST /chat/conversations/:id/messages/ — send message
POST /chat/conversations/:id/read/     — mark read
POST /chat/media/                      — upload media
GET  /chat/presence/online/            — list online users
POST /chat/presence/                   — update own presence
POST /chat/calls/                      — initiate call
PATCH /chat/calls/:id/                 — end call
GET  /chat/unread-count/               — unread count
GET  /chat/audit-logs/                 — group creation logs
```

WebSocket events (via `ChatWebSocket`):
- `typing` — `{ conversation_id, user_id, is_typing }`
- `message` — new message payload
- `presence` — `{ user_id, is_online }`
- `call_invite` — incoming call
- `call_status` — call status change

---

## State Management

The `useChatStore` Zustand store persists `conversations`, `messages`, and `auditLogs` to `localStorage` under the key `nexus-chat-store`. Active call state and typing indicators are ephemeral (not persisted).

---

## Styling

All components use the existing Nexus CSS custom properties:
- `--surface`, `--surface-card`, `--surface-elevated`, `--surface-border`
- `--Swahilipot-500/600/700`
- Shared utility classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.input`, `.modal-*`, `.badge-*`
- No new CSS required.
