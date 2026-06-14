// ── Nexus AI Assistant — Service Layer ────────────────────────────────────────
// All AI calls go through YOUR Django backend.
// The OpenRouter API key lives ONLY in backend/.env — never in the browser.
//
// Flow:
//   Frontend → POST /api/v1/ai/chat/   (your Django REST API, JWT-authenticated)
//   Django   → POST https://openrouter.ai/api/v1/chat/completions (key from .env)
//   Django   → returns { reply, usage, daily_used, daily_budget }

import { api } from "./api"; // your existing axios instance with JWT interceptor
import type { AIConversation, OpenRouterMessage } from "../types/ai";

const MAX_HISTORY = 20;

// ── Chat API ──────────────────────────────────────────────────────────────────
export const aiApi = {
  // Send messages — system prompt is built server-side from the JWT user
  chat: (messages: OpenRouterMessage[]) =>
    api.post<{
      reply: string;
      model: string;
      usage?: Record<string, number>;
      daily_used: number;
      daily_budget: number;
    }>("/ai/chat/", { messages: messages.slice(-MAX_HISTORY) }),

  // Saved conversations (optional — for cross-device sync)
  conversations: (params?: any) => api.get("/ai/conversations/", { params }),
  conversation:  (id: string)   => api.get(`/ai/conversations/${id}/`),
  saveConversation: (data: { title: string; messages: OpenRouterMessage[]; conversation_id?: string }) =>
    api.post("/ai/conversations/", data),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}/`),
};

// ── Call Django backend with retry on rate limit ─────────────────────────────
// Retries are silent — caller (the hook) just awaits the final reply.
const RETRY_DELAYS = [3000, 8000, 15000];
const MAX_RETRIES  = 3;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function sendChatMessage(
  messages: OpenRouterMessage[],
  signal?: AbortSignal
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await aiApi.chat(messages);
      return res.data.reply;
    } catch (err: any) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const status = err?.response?.status;
      const isRateLimit = status === 429;

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }

      // Map backend errors to friendly messages
      if (status === 503) {
        throw new Error("AI service is not configured. Contact your administrator.");
      }
      if (status === 429) {
        throw new Error("I'm handling too many requests right now. Please try again shortly.");
      }
      if (status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }
      throw new Error(err?.response?.data?.error || "Something went wrong. Please try again.");
    }
  }
  throw new Error("Something went wrong. Please try again.");
}

// ── Title generator ───────────────────────────────────────────────────────────
export function generateTitle(firstMessage: string): string {
  const clean = firstMessage.trim().replace(/\s+/g, " ");
  return clean.length > 44 ? clean.slice(0, 44) + "…" : clean;
}

// ── Conversation persistence (localStorage per user) ─────────────────────────
const STORAGE_KEY = (userId: string) => `nexus_ai_${userId}`;
const MAX_STORED = 50;

export function loadConversations(userId: string): AIConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AIConversation[];
    return parsed.map(c => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch { return []; }
}

export function saveConversations(userId: string, convs: AIConversation[]): void {
  try {
    const trimmed = [...convs]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(trimmed));
  } catch { /* quota exceeded */ }
}
