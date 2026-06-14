// ── Nexus AI Assistant ─────────────────────────────────────────────────────────
// Tailwind version — matches the Nexus design system (surface-*, nexus-*, Swahilipot-*)
// Two exports:
//   - AITopbarButton  → small icon button for the topbar (next to ChatTopbarButton)
//   - AIPanel         → floating chat panel (rendered once, near ChatPanel)
//
// Usage in AppLayout.tsx:
//   import { AITopbarButton, AIPanel } from "../ai/AIAssistant";
//   ...
//   <ChatTopbarButton />
//   <AITopbarButton />          ← add next to it in the topbar
//   ...
//   <ChatPanel />
//   <AIPanel />                  ← add next to it, outside <header>

import React, { useRef, useEffect, useState, useCallback, KeyboardEvent } from "react";
import { Sparkles, X, Send, Plus, Square } from "lucide-react";
import { useAIAssistant } from "../../hooks/useAIAssistant";
import { useAuthStore } from "../../services/api";

// ── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Summarise today's attendance",
  "Draft a department update email",
  "What tasks are overdue?",
  "Explain the internship workflow",
];

// ── Shared hook instance via context-free singleton pattern ─────────────────
// Both the topbar button and the panel need the same state.
// We use a tiny module-level event bus so either component can toggle the panel.

type Listener = () => void;
const listeners = new Set<Listener>();
let _isOpen = false;

function setOpen(value: boolean) {
  _isOpen = value;
  listeners.forEach((l) => l());
}
function useSharedOpen() {
  const [open, setLocal] = useState(_isOpen);
  useEffect(() => {
    const fn = () => setLocal(_isOpen);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return open;
}

// ── Topbar button ─────────────────────────────────────────────────────────────
export const AITopbarButton: React.FC = () => {
  const isOpen = useSharedOpen();

  return (
    <button
      onClick={() => setOpen(!isOpen)}
      className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
      title="Nexus AI Assistant"
      aria-label="Toggle AI Assistant">
      <Sparkles size={15} className={isOpen ? "text-Swahilipot-400" : ""} />
    </button>
  );
};

// ── Typing dots ───────────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1.2s" }}
      />
    ))}
  </div>
);

// ── Floating panel ────────────────────────────────────────────────────────────
export const AIPanel: React.FC = () => {
  const isOpen = useSharedOpen();
  const user = useAuthStore((s) => s.user);

  const {
    conversations, activeConversation, status, error,
    startNew, selectConversation, sendMessage, clearError, cancelRequest,
  } = useAIAssistant();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, status]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 110) + "px";
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || status === "thinking") return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, sendMessage, status]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  if (!isOpen) return null;

  const isThinking = status === "thinking";
  const canSend = input.trim().length > 0 && !isThinking;
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  const fmtTime = (d: Date) =>
    new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) +
    " " + fmtTime(d);

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] w-[820px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)]
                 bg-surface-card border border-surface-border rounded-2xl shadow-elevated
                 flex overflow-hidden animate-slide-up"
      role="dialog"
      aria-label="Nexus AI Assistant">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-[220px] min-w-[220px] bg-surface-elevated border-r border-surface-border flex flex-col">
        <div className="p-3 border-b border-surface-border">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Conversations
          </span>
          <button
            onClick={startNew}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                       bg-Swahilipot-600/15 border border-Swahilipot-500/30 text-Swahilipot-400
                       hover:bg-Swahilipot-600/25 transition-colors">
            <Plus size={13} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-[11px] text-slate-600 text-center py-4 px-2">
              No conversations yet
            </p>
          )}
          {conversations.map((c) => {
            const active = c.id === activeConversation?.id;
            return (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors ${
                  active
                    ? "bg-Swahilipot-600/15 border-Swahilipot-500/40"
                    : "border-transparent hover:bg-surface-muted"
                }`}>
                <div className="text-xs text-slate-300 truncate">{c.title}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{fmtDate(c.updatedAt)}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-surface-border bg-surface-card shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-Nexus flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Nexus AI</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-500/15 border border-nexus-500/30 text-nexus-400">
            {user?.organisation_name ?? "SwahiliPot"}
          </span>

          {isThinking && (
            <button
              onClick={cancelRequest}
              className="ml-auto mr-1 flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors">
              <Square size={11} fill="currentColor" />
              Stop
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className={`${isThinking ? "" : "ml-auto"} p-1 rounded-lg text-slate-500 hover:text-white hover:bg-surface-elevated transition-colors`}
            aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
          {!activeConversation ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2.5 px-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-Nexus flex items-center justify-center mb-1">
                <Sparkles size={20} className="text-white" />
              </div>
              <p className="text-sm font-medium text-white">
                Hi{user ? `, ${user.first_name}` : ""}! I'm Nexus AI
              </p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Ask me anything about your organisation, draft emails, analyse data,
                or get help navigating Nexus.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isThinking}
                    className="px-3 py-1.5 rounded-full text-[11px] text-Swahilipot-400
                               bg-Swahilipot-600/10 border border-Swahilipot-500/25
                               hover:bg-Swahilipot-600/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeConversation.messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-2 items-end ${isUser ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isUser ? "bg-gradient-Nexus text-white" : "bg-surface-elevated text-slate-400"
                      }`}>
                      {isUser ? initials : <Sparkles size={13} />}
                    </div>
                    <div
                      className={`max-w-[76%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? "bg-gradient-Nexus text-white rounded-br-md"
                          : "bg-surface-elevated border border-surface-border text-slate-200 rounded-bl-md"
                      }`}>
                      {msg.content}
                      <div className={`text-[10px] mt-1 opacity-50 text-right ${isUser ? "text-white" : "text-slate-400"}`}>
                        {fmtTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex gap-2 items-end">
                  <div className="w-7 h-7 min-w-[28px] rounded-full bg-surface-elevated text-slate-400 flex items-center justify-center shrink-0">
                    <Sparkles size={13} />
                  </div>
                  <div className="bg-surface-elevated border border-surface-border rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <TypingDots />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-xs">
            <AlertCircleIcon />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300 text-base leading-none">
              ×
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 px-3 py-2.5 border-t border-surface-border shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask Nexus AI anything…"
            rows={1}
            disabled={isThinking}
            aria-label="Message input"
            className="flex-1 resize-none rounded-xl border border-surface-border bg-surface-muted
                       text-white placeholder:text-slate-500 text-[13px] px-3.5 py-2.5
                       min-h-[40px] max-h-[110px] leading-relaxed outline-none
                       focus:border-Swahilipot-500/50 focus:ring-2 focus:ring-Swahilipot-500/15
                       disabled:opacity-60 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send"
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
              canSend
                ? "bg-gradient-Nexus text-white shadow-glow-blue hover:opacity-90"
                : "bg-surface-elevated text-slate-600 cursor-not-allowed"
            }`}>
            <Send size={15} />
          </button>
        </div>
        <p className="px-3 pb-2 text-[10px] text-slate-600 text-center shrink-0">
          Nexus AI · Powered by OpenRouter{user?.role_display ? ` · ${user.role_display}` : ""}
        </p>
      </div>
    </div>
  );
};

// Small inline icon to avoid extra import when error renders
const AlertCircleIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default AIPanel;
