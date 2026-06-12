"""Nexus Chat — Django Admin"""
from django.contrib import admin
from .models import (
    Conversation,
    ConversationParticipant,
    Message,
    ChatMedia,
    UserPresence,
    Call,
    ChatAuditLog,
)


class ParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0
    readonly_fields = ["joined_at", "last_read_at"]
    raw_id_fields = ["user"]


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ["created_at", "sender", "content", "status"]
    can_delete = False
    show_change_link = True
    fields = ["sender", "content", "status", "is_system", "created_at"]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["__str__", "type", "created_by", "created_at", "participant_count"]
    list_filter = ["type", "created_at"]
    search_fields = ["name", "participants__user__email"]
    inlines = [ParticipantInline, MessageInline]
    readonly_fields = ["created_at", "updated_at"]

    def participant_count(self, obj):
        return obj.participants.filter(left_at__isnull=True).count()
    participant_count.short_description = "Members"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["sender", "conversation", "content_preview", "status", "is_system", "created_at"]
    list_filter = ["status", "is_system", "created_at"]
    search_fields = ["content", "sender__email", "conversation__name"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["sender", "conversation", "reply_to"]

    def content_preview(self, obj):
        return obj.content[:80] if obj.content else "(media/call)"
    content_preview.short_description = "Content"


@admin.register(ChatMedia)
class ChatMediaAdmin(admin.ModelAdmin):
    list_display = ["name", "media_type", "conversation", "uploaded_by", "size_display", "created_at"]
    list_filter = ["media_type", "created_at"]
    search_fields = ["name", "uploaded_by__email"]
    readonly_fields = ["created_at"]

    def size_display(self, obj):
        if obj.size > 1024 * 1024:
            return f"{obj.size / 1024 / 1024:.1f} MB"
        return f"{obj.size // 1024} KB"
    size_display.short_description = "Size"


@admin.register(UserPresence)
class UserPresenceAdmin(admin.ModelAdmin):
    list_display = ["user", "status", "last_seen", "updated_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "user__first_name", "user__last_name"]


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ["initiator", "recipient", "call_type", "status", "duration_display", "started_at"]
    list_filter = ["call_type", "status", "started_at"]
    search_fields = ["initiator__email", "recipient__email"]
    readonly_fields = ["started_at", "ended_at"]

    def duration_display(self, obj):
        if obj.duration:
            m, s = divmod(obj.duration, 60)
            return f"{m}:{s:02d}"
        return "—"
    duration_display.short_description = "Duration"


@admin.register(ChatAuditLog)
class ChatAuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "performed_by", "group_name", "created_at"]
    list_filter = ["action", "created_at"]
    search_fields = ["performed_by__email", "group_name"]
    readonly_fields = ["created_at"]