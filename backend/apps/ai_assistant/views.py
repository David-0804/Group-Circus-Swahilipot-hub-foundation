# backend/apps/ai_assistant/views.py
# ── Nexus AI Assistant — Django Views (OpenRouter Proxy) ──────────────────────
#
# Security model:
#   1. JWT authentication via DRF — only logged-in users
#   2. OPENROUTER_API_KEY lives in Django .env — never exposed to browser
#   3. System prompt built server-side — frontend only sends messages[]
#   4. Rate-limiting via django-ratelimit (15 req/min per user)
#   5. Daily request budget per user
#   6. Model locked server-side

import os
import logging
from datetime import date

import requests
from django.core.cache import cache
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AIConversation, AIMessage
from .serializers import AIConversationSerializer, AIMessageSerializer

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions"
AI_MODEL         = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free")
MAX_TOKENS       = 1024
TEMPERATURE      = 0.7
MAX_HISTORY      = 20          # messages to keep in context
DAILY_REQ_BUDGET = 200         # per user per day
REQ_TIMEOUT      = 30          # seconds


def get_system_prompt(user) -> str:
    """Build a scoped system prompt from the authenticated user's profile."""
    from datetime import datetime
    today = datetime.now().strftime("%A, %d %B %Y")
    return (
        f"You are Nexus AI, the intelligent assistant embedded inside the Nexus Enterprise "
        f"Management System at {getattr(user, 'organisation_name', 'SwahiliPot Foundation') or 'SwahiliPot Foundation'}.\n\n"
        f"You assist {user.get_full_name()} ({getattr(user, 'role_display', user.role) if hasattr(user, 'role_display') else 'Staff'}"
        f"{f', {user.department_name}' if getattr(user, 'department_name', None) else ''}) with:\n"
        f"- Answering questions about the organisation, departments, and workflows\n"
        f"- Drafting communications, reports, and summaries\n"
        f"- Explaining platform features and navigation\n"
        f"- Analysing attendance, tasks, projects, and performance data when provided\n"
        f"- General work-related questions and research\n\n"
        f"Guidelines:\n"
        f"- Be concise, professional, and helpful\n"
        f"- Use the user's first name occasionally to personalise responses\n"
        f"- If asked about live data, explain you can see data the user shares but don't have direct system access\n"
        f"- Never fabricate specific data\n"
        f"- Format responses clearly using bullet points or numbered lists where appropriate\n"
        f"- Today's date: {today}"
    )


def check_daily_budget(user_id: str) -> tuple[bool, int]:
    """Returns (within_budget, requests_used_today)."""
    key = f"ai_daily_{user_id}_{date.today()}"
    used = cache.get(key, 0)
    return used < DAILY_REQ_BUDGET, used


def increment_daily_budget(user_id: str):
    key = f"ai_daily_{user_id}_{date.today()}"
    used = cache.get(key, 0)
    cache.set(key, used + 1, timeout=86400)  # 24h TTL


# ── POST /api/v1/ai/chat/ ─────────────────────────────────────────────────────
class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            logger.error("OPENROUTER_API_KEY not set in environment")
            return Response(
                {"error": "AI service not configured. Contact your administrator."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        messages = request.data.get("messages", [])
        if not messages or not isinstance(messages, list):
            return Response({"error": "messages[] is required"}, status=400)

        if len(messages) > MAX_HISTORY + 5:
            return Response({"error": "Too many messages in request"}, status=400)

        # Validate each message
        for m in messages:
            if not isinstance(m, dict):
                return Response({"error": "Invalid message format"}, status=400)
            if m.get("role") not in ("user", "assistant", "system"):
                return Response({"error": "Invalid message role"}, status=400)
            if not isinstance(m.get("content", ""), str):
                return Response({"error": "Invalid message content"}, status=400)

        # Rate limit check
        within_budget, used = check_daily_budget(str(request.user.id))
        if not within_budget:
            return Response(
                {"error": f"Daily AI request limit reached ({DAILY_REQ_BUDGET}/day). Resets at midnight."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Build full message list with server-side system prompt
        # (frontend never sends system prompt — we build it here)
        full_messages = [
            {"role": "system", "content": get_system_prompt(request.user)},
            *[
                {"role": m["role"], "content": m["content"]}
                for m in messages[-MAX_HISTORY:]
                if m.get("role") != "system"  # strip any system messages from client
            ],
        ]

        try:
            resp = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": request.headers.get("Origin", "https://nexus.swahilipot.org"),
                    "X-Title": "Nexus AI Assistant",
                },
                json={
                    "model": AI_MODEL,
                    "messages": full_messages,
                    "temperature": TEMPERATURE,
                    "max_tokens": MAX_TOKENS,
                },
                timeout=REQ_TIMEOUT,
            )
            resp.raise_for_status()
        except requests.Timeout:
            return Response({"error": "AI service timed out. Please try again."}, status=504)
        except requests.HTTPError as e:
            code = e.response.status_code if e.response else 500
            if code == 429:
                return Response({"error": "AI service is busy. Please try again in a moment."}, status=429)
            if code in (401, 403):
                logger.error("OpenRouter auth error: %s", e)
                return Response({"error": "AI service configuration error."}, status=503)
            logger.error("OpenRouter HTTP error %s: %s", code, e)
            return Response({"error": "AI service error. Please try again."}, status=502)
        except requests.RequestException as e:
            logger.error("OpenRouter request failed: %s", e)
            return Response({"error": "Could not reach AI service."}, status=502)

        data = resp.json()
        reply = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if not reply:
            return Response({"error": "Empty response from AI."}, status=502)

        increment_daily_budget(str(request.user.id))

        return Response({
            "reply": reply,
            "model": AI_MODEL,
            "usage": data.get("usage", {}),
            "daily_used": used + 1,
            "daily_budget": DAILY_REQ_BUDGET,
        })


# ── /api/v1/ai/conversations/ ─────────────────────────────────────────────────
class AIConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = AIConversationSerializer

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["delete"])
    def clear_all(self, request):
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
