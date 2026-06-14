"""
apps/chat/urls.py
Mounted at: api/v1/chat/   (already in your Nexus/urls.py)
"""
from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path("conversations/", views.ConversationListView.as_view(), name="chat-conversations"),
    path("conversations/direct/", views.CreateDirectConversationView.as_view(), name="chat-create-direct"),
    path("conversations/groups/", views.CreateGroupConversationView.as_view(), name="chat-create-group"),
    path("conversations/<uuid:conv_id>/", views.ConversationDetailView.as_view(), name="chat-conversation-detail"),
    path("conversations/<uuid:conv_id>/leave/", views.LeaveConversationView.as_view(), name="chat-leave"),
    path("conversations/<uuid:conv_id>/messages/", views.MessageListView.as_view(), name="chat-messages"),
    path("conversations/<uuid:conv_id>/read/", views.MarkReadView.as_view(), name="chat-mark-read"),
    path("conversations/<uuid:conv_id>/media/", views.SharedMediaView.as_view(), name="chat-shared-media"),
    path("conversations/<uuid:conv_id>/calls/", views.CallHistoryView.as_view(), name="chat-call-history"),

    # Messages
    path("messages/<uuid:msg_id>/", views.UpdateMessageStatusView.as_view(), name="chat-message-status"),

    # Media upload
    path("media/", views.UploadMediaView.as_view(), name="chat-upload-media"),

    # Presence
    path("presence/online/", views.OnlineUsersView.as_view(), name="chat-online-users"),
    path("presence/", views.UpdatePresenceView.as_view(), name="chat-update-presence"),

    # Calls
    path("calls/", views.InitiateCallView.as_view(), name="chat-initiate-call"),
    path("calls/<uuid:call_id>/", views.EndCallView.as_view(), name="chat-end-call"),

    # Utility
    path("unread-count/", views.UnreadCountView.as_view(), name="chat-unread-count"),
    path("audit-logs/", views.AuditLogListView.as_view(), name="chat-audit-logs"),
]
