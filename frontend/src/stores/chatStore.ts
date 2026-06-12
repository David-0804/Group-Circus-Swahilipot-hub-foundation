// Nexus Chat Store — Zustand state management for the entire chat system
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MessageStatus = "sending" | "sent" | "delivered" | "seen";
export type MediaType = "image" | "video" | "audio" | "document";
export type CallStatus = "ringing" | "connected" | "ended" | "missed" | "declined";

export interface MediaAttachment {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  size: number;
  thumbnailUrl?: string;
  mimeType: string;
}

export interface CallRecord {
  id: string;
  type: "voice" | "video";
  status: CallStatus;
  initiatorId: string;
  recipientId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number; // seconds
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  media?: MediaAttachment[];
  callRecord?: CallRecord;
  replyTo?: string; // message id
  isSystem?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  department?: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string; // for groups
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  createdBy?: string;
  avatar?: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: "group_created" | "group_creation_denied";
  performedBy: string;
  performedByName: string;
  timestamp: string;
  groupName?: string;
  reason?: string;
}

interface ChatState {
  // Panel state
  isChatOpen: boolean;
  isExpanded: boolean;
  activeConversationId: string | null;
  activeTab: "groups" | "direct";

  // Data
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages
  onlineUsers: Record<string, boolean>; // userId -> isOnline
  typingUsers: Record<string, Record<string, boolean>>; // conversationId -> userId -> isTyping
  auditLogs: AuditLog[];

  // Active call
  activeCall: CallRecord | null;
  callStatus: CallStatus | null;

  // Actions
  toggleChat: () => void;
  toggleExpanded: () => void;
  setActiveConversation: (id: string | null) => void;
  setActiveTab: (tab: "groups" | "direct") => void;

  addMessage: (message: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: MessageStatus) => void;
  sendMessage: (conversationId: string, senderId: string, senderName: string, content: string, media?: MediaAttachment[]) => Message;

  getOrCreateConversation: (currentUser: Participant, otherUser: Participant) => string;
  createGroup: (name: string, description: string, creatorId: string, creatorName: string, creatorRole: string, participants: Participant[]) => { success: boolean; error?: string; groupId?: string };

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;

  startCall: (type: "voice" | "video", initiatorId: string, recipientId: string, conversationId: string) => void;
  endCall: (status: CallStatus) => void;

  markConversationRead: (conversationId: string) => void;
  getTotalUnread: () => number;
}

// Seed data for demo
const DEMO_USERS: Participant[] = [
  { id: "u1", name: "Sarah Kamau", role: "Supervisor", department: "Broadcast", email: "sarah.kamau@nexus.co.ke", isOnline: true },
  { id: "u2", name: "John Mwangi", role: "Journalist", department: "News", email: "john.mwangi@nexus.co.ke", isOnline: true },
  { id: "u3", name: "Amina Ochieng", role: "HR Officer", department: "Human Resources", email: "amina.ochieng@nexus.co.ke", isOnline: false, lastSeen: "2 hours ago" },
  { id: "u4", name: "David Otieno", role: "Station Engineer", department: "Broadcast", email: "david.otieno@nexus.co.ke", isOnline: true },
  { id: "u5", name: "Grace Wanjiku", role: "Presenter", department: "Radio", email: "grace.wanjiku@nexus.co.ke", isOnline: false, lastSeen: "Yesterday" },
  { id: "u6", name: "Peter Njoroge", role: "Videographer", department: "Production", email: "peter.njoroge@nexus.co.ke", isOnline: true },
];

const now = () => new Date().toISOString();
const past = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-general",
    type: "group",
    name: "#General",
    participants: DEMO_USERS,
    unreadCount: 3,
    createdAt: past(10080),
    createdBy: "admin",
    description: "General announcements for all staff",
    lastMessage: {
      id: "m-last-1",
      conversationId: "conv-general",
      senderId: "u1",
      senderName: "Sarah Kamau",
      content: "Morning briefing at 9am today",
      timestamp: past(30),
      status: "seen",
    },
  },
  {
    id: "conv-broadcast",
    type: "group",
    name: "#Broadcast",
    participants: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[3], DEMO_USERS[4]],
    unreadCount: 1,
    createdAt: past(20160),
    createdBy: "admin",
    description: "Broadcast team coordination",
    lastMessage: {
      id: "m-last-2",
      conversationId: "conv-broadcast",
      senderId: "u4",
      senderName: "David Otieno",
      content: "FM transmitter is back online ✅",
      timestamp: past(120),
      status: "seen",
    },
  },
  {
    id: "conv-dm-u1",
    type: "direct",
    participants: [DEMO_USERS[0]],
    unreadCount: 2,
    createdAt: past(4320),
    lastMessage: {
      id: "m-last-3",
      conversationId: "conv-dm-u1",
      senderId: "u1",
      senderName: "Sarah Kamau",
      content: "Can you review the logbook submissions?",
      timestamp: past(15),
      status: "delivered",
    },
  },
  {
    id: "conv-dm-u2",
    type: "direct",
    participants: [DEMO_USERS[1]],
    unreadCount: 0,
    createdAt: past(2880),
    lastMessage: {
      id: "m-last-4",
      conversationId: "conv-dm-u2",
      senderId: "current-user",
      senderName: "You",
      content: "Thanks for the update!",
      timestamp: past(180),
      status: "seen",
    },
  },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  "conv-general": [
    { id: "mg1", conversationId: "conv-general", senderId: "u4", senderName: "David Otieno", content: "Good morning team! Ready for another productive day.", timestamp: past(95), status: "seen" },
    { id: "mg2", conversationId: "conv-general", senderId: "u1", senderName: "Sarah Kamau", content: "Morning David! Don't forget the equipment check at 8am.", timestamp: past(90), status: "seen" },
    { id: "mg3", conversationId: "conv-general", senderId: "u2", senderName: "John Mwangi", content: "On it. Also the news bulletin is ready for review.", timestamp: past(85), status: "seen", media: [{ id: "f1", type: "document", url: "#", name: "bulletin_draft.pdf", size: 245000, mimeType: "application/pdf" }] },
    { id: "mg4", conversationId: "conv-general", senderId: "u1", senderName: "Sarah Kamau", content: "Morning briefing at 9am today", timestamp: past(30), status: "seen" },
  ],
  "conv-broadcast": [
    { id: "mb1", conversationId: "conv-broadcast", senderId: "u4", senderName: "David Otieno", content: "Transmitter issue detected at 06:30. Working on it.", timestamp: past(180), status: "seen" },
    { id: "mb2", conversationId: "conv-broadcast", senderId: "u1", senderName: "Sarah Kamau", content: "How long do you estimate for the fix?", timestamp: past(170), status: "seen" },
    { id: "mb3", conversationId: "conv-broadcast", senderId: "u4", senderName: "David Otieno", content: "About 90 mins. I'll keep you posted.", timestamp: past(165), status: "seen" },
    { id: "mb4", conversationId: "conv-broadcast", senderId: "u4", senderName: "David Otieno", content: "FM transmitter is back online ✅", timestamp: past(120), status: "seen" },
  ],
  "conv-dm-u1": [
    { id: "md1", conversationId: "conv-dm-u1", senderId: "current-user", senderName: "You", content: "Hi Sarah, how are the attachees settling in?", timestamp: past(60), status: "seen" },
    { id: "md2", conversationId: "conv-dm-u1", senderId: "u1", senderName: "Sarah Kamau", content: "Going well! Most of them have submitted their Week 1 logbooks already.", timestamp: past(45), status: "seen" },
    { id: "md3", conversationId: "conv-dm-u1", senderId: "u1", senderName: "Sarah Kamau", content: "Can you review the logbook submissions?", timestamp: past(15), status: "delivered" },
  ],
  "conv-dm-u2": [
    { id: "md4", conversationId: "conv-dm-u2", senderId: "u2", senderName: "John Mwangi", content: "Hey, sent over the news brief for today.", timestamp: past(200), status: "seen" },
    { id: "md5", conversationId: "conv-dm-u2", senderId: "current-user", senderName: "You", content: "Thanks for the update!", timestamp: past(180), status: "seen" },
  ],
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isChatOpen: false,
      isExpanded: false,
      activeConversationId: null,
      activeTab: "groups",

      conversations: DEMO_CONVERSATIONS,
      messages: DEMO_MESSAGES,
      onlineUsers: { u1: true, u2: true, u4: true, u6: true },
      typingUsers: {},
      auditLogs: [],
      activeCall: null,
      callStatus: null,

      toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen, activeConversationId: s.isChatOpen ? null : s.activeConversationId })),
      toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      addMessage: (message) => {
        set((s) => {
          const existing = s.messages[message.conversationId] || [];
          const conversations = s.conversations.map((c) =>
            c.id === message.conversationId
              ? { ...c, lastMessage: message, unreadCount: message.senderId !== "current-user" && s.activeConversationId !== message.conversationId ? c.unreadCount + 1 : c.unreadCount }
              : c
          );
          return {
            messages: { ...s.messages, [message.conversationId]: [...existing, message] },
            conversations,
          };
        });
      },

      updateMessageStatus: (conversationId, messageId, status) => {
        set((s) => ({
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] || []).map((m) =>
              m.id === messageId ? { ...m, status } : m
            ),
          },
        }));
      },

      sendMessage: (conversationId, senderId, senderName, content, media) => {
        const message: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId,
          senderName,
          content,
          timestamp: now(),
          status: "sending",
          media,
        };
        get().addMessage(message);
        // Simulate delivery
        setTimeout(() => get().updateMessageStatus(conversationId, message.id, "sent"), 500);
        setTimeout(() => get().updateMessageStatus(conversationId, message.id, "delivered"), 1200);
        return message;
      },

      getOrCreateConversation: (currentUser, otherUser) => {
        const state = get();
        // Find existing DM between these two users
        const existing = state.conversations.find(
          (c) => c.type === "direct" && c.participants.some((p) => p.id === otherUser.id)
        );
        if (existing) return existing.id;

        // Create new conversation
        const newConv: Conversation = {
          id: `conv-dm-${Date.now()}`,
          type: "direct",
          participants: [otherUser],
          unreadCount: 0,
          createdAt: now(),
        };
        set((s) => ({ conversations: [newConv, ...s.conversations] }));
        return newConv.id;
      },

      createGroup: (name, description, creatorId, creatorName, creatorRole, participants) => {
        // Backend enforcement: only admin/system_admin can create groups
        if (!["system_admin", "broadcast_admin", "hr_officer", "executive"].includes(creatorRole)) {
          const log: AuditLog = {
            id: `audit-${Date.now()}`,
            action: "group_creation_denied",
            performedBy: creatorId,
            performedByName: creatorName,
            timestamp: now(),
            groupName: name,
            reason: "Insufficient permissions",
          };
          set((s) => ({ auditLogs: [...s.auditLogs, log] }));
          return { success: false, error: "Only admins can create groups." };
        }

        const groupId = `conv-group-${Date.now()}`;
        const newGroup: Conversation = {
          id: groupId,
          type: "group",
          name: `#${name.toLowerCase().replace(/\s+/g, "-")}`,
          description,
          participants,
          unreadCount: 0,
          createdAt: now(),
          createdBy: creatorId,
        };

        const systemMsg: Message = {
          id: `msg-system-${Date.now()}`,
          conversationId: groupId,
          senderId: "system",
          senderName: "System",
          content: `Group "${name}" created by ${creatorName}`,
          timestamp: now(),
          status: "seen",
          isSystem: true,
        };

        const log: AuditLog = {
          id: `audit-${Date.now()}`,
          action: "group_created",
          performedBy: creatorId,
          performedByName: creatorName,
          timestamp: now(),
          groupName: name,
        };

        set((s) => ({
          conversations: [newGroup, ...s.conversations],
          messages: { ...s.messages, [groupId]: [systemMsg] },
          auditLogs: [...s.auditLogs, log],
        }));

        return { success: true, groupId };
      },

      setTyping: (conversationId, userId, isTyping) => {
        set((s) => ({
          typingUsers: {
            ...s.typingUsers,
            [conversationId]: {
              ...(s.typingUsers[conversationId] || {}),
              [userId]: isTyping,
            },
          },
        }));
      },

      setUserOnline: (userId, isOnline) => {
        set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: isOnline } }));
      },

      startCall: (type, initiatorId, recipientId, conversationId) => {
        const call: CallRecord = {
          id: `call-${Date.now()}`,
          type,
          status: "ringing",
          initiatorId,
          recipientId,
          startedAt: now(),
        };
        set({ activeCall: call, callStatus: "ringing" });
        // Simulate call connection after 3 seconds (demo)
        setTimeout(() => {
          set({ callStatus: "connected" });
          set((s) => s.activeCall ? { activeCall: { ...s.activeCall, status: "connected" } } : {});
        }, 3000);
      },

      endCall: (status) => {
        const state = get();
        if (state.activeCall) {
          const endedCall = { ...state.activeCall, status, endedAt: now() };
          if (endedCall.startedAt) {
            const start = new Date(endedCall.startedAt).getTime();
            const end = new Date(endedCall.endedAt!).getTime();
            endedCall.duration = Math.round((end - start) / 1000);
          }
          // Add call record to conversation messages
          const convId = state.conversations.find(
            (c) => c.type === "direct" && c.participants.some((p) => p.id === state.activeCall!.recipientId || p.id === state.activeCall!.initiatorId)
          )?.id;

          if (convId) {
            const callMsg: Message = {
              id: `msg-call-${Date.now()}`,
              conversationId: convId,
              senderId: endedCall.initiatorId,
              senderName: "You",
              content: "",
              timestamp: now(),
              status: "seen",
              callRecord: endedCall,
            };
            get().addMessage(callMsg);
          }
        }
        set({ activeCall: null, callStatus: null });
      },

      markConversationRead: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] || []).map((m) =>
              m.senderId !== "current-user" ? { ...m, status: "seen" as MessageStatus } : m
            ),
          },
        }));
      },

      getTotalUnread: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    }),
    {
      name: "nexus-chat-store",
      partialize: (s) => ({
        conversations: s.conversations,
        messages: s.messages,
        auditLogs: s.auditLogs,
        isChatOpen: s.isChatOpen,
      }),
    }
  )
);
