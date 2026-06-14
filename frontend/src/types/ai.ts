// ── Nexus AI Assistant — TypeScript Types ─────────────────────────────────────

export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: string; // optional department/module context
}

export type AIAssistantStatus = "idle" | "thinking" | "streaming" | "error";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIStore {
  conversations: AIConversation[];
  activeConversationId: string | null;
  status: AIAssistantStatus;
  error: string | null;
  isOpen: boolean;
}
