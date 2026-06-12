"""Nexus Chat — URL Configuration"""
from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    CreateDirectConversationView,
    CreateGroupConversationView,
    UpdateGroupView,
    LeaveGroupView,
    MessageListView,
    MarkReadView,
    UpdateMessageStatusView,
    MediaUploadView,
    SharedMediaView,
    OnlineUsersView,
    UpdatePresenceView,
    InitiateCallView,
    EndCallView,
    CallHistoryView,
    UnreadCountView,
    AuditLogView,
)

urlpatterns = [
    # ── Conversations ────────────────────────────────────────────────────────
    path("conversations/",                          ConversationListView.as_view(),         name="chat-conversation-list"),
    path("conversations/direct/",                   CreateDirectConversationView.as_view(),  name="chat-direct-create"),
    path("conversations/groups/",                   CreateGroupConversationView.as_view(),   name="chat-group-create"),
    path("conversations/<uuid:pk>/",                ConversationDetailView.as_view(),        name="chat-conversation-detail"),
    path("conversations/<uuid:pk>/update/",         UpdateGroupView.as_view(),               name="chat-group-update"),
    path("conversations/<uuid:pk>/leave/",          LeaveGroupView.as_view(),                name="chat-group-leave"),

    # ── Messages ─────────────────────────────────────────────────────────────
    path("conversations/<uuid:pk>/messages/",       MessageListView.as_view(),               name="chat-message-list"),
    path("conversations/<uuid:pk>/read/",           MarkReadView.as_view(),                  name="chat-mark-read"),
    path("messages/<uuid:pk>/",                     UpdateMessageStatusView.as_view(),       name="chat-message-status"),

    # ── Media ────────────────────────────────────────────────────────────────
    path("media/",                                  MediaUploadView.as_view(),               name="chat-media-upload"),
    path("conversations/<uuid:pk>/media/",          SharedMediaView.as_view(),               name="chat-shared-media"),

    # ── Presence ─────────────────────────────────────────────────────────────
    path("presence/online/",                        OnlineUsersView.as_view(),               name="chat-online-users"),
    path("presence/",                               UpdatePresenceView.as_view(),             name="chat-presence-update"),

    # ── Calls ────────────────────────────────────────────────────────────────
    path("calls/",                                  InitiateCallView.as_view(),              name="chat-call-initiate"),
    path("calls/<uuid:pk>/",                        EndCallView.as_view(),                   name="chat-call-end"),
    path("conversations/<uuid:pk>/calls/",          CallHistoryView.as_view(),               name="chat-call-history"),

    # ── Admin / Meta ─────────────────────────────────────────────────────────
    path("unread-count/",                           UnreadCountView.as_view(),               name="chat-unread-count"),
    path("audit-logs/",                             AuditLogView.as_view(),                  name="chat-audit-logs"),
]