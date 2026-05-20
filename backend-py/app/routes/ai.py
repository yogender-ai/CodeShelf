from __future__ import annotations

import re

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.deps import get_current_user
from app.models import User


router = APIRouter(prefix="/api/ai", tags=["ai"])
settings = get_settings()


class TextIn(BaseModel):
    text: str = ""
    note_id: str | None = None
    title: str = ""
    topic: str = "General"


def cheap_summary(text: str, max_sentences: int = 3) -> str:
    clean = re.sub(r"```[\s\S]*?```", " ", text or "")
    sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+|\n+", clean) if len(item.strip()) > 24]
    return " ".join(sentences[:max_sentences]) or clean[:320]


async def ask_gemini(prompt: str) -> str:
    if not settings.gemini_api_key:
        return ""
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": settings.gemini_api_key},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            data = response.json()
            if not response.is_success:
                return ""
            return "\n".join(part.get("text", "") for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []))
    except Exception:
        return ""


@router.post("/summarize-note")
async def summarize_note(body: TextIn, user: User = Depends(get_current_user)):
    if settings.hf_api_key and body.text:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
                    headers={"Authorization": f"Bearer {settings.hf_api_key}"},
                    json={"inputs": body.text[:6000]},
                )
                data = response.json()
                if response.is_success and data:
                    return {"summary": data[0].get("summary_text", cheap_summary(body.text)), "provider": "huggingface-bart"}
        except Exception:
            pass
    return {"summary": cheap_summary(body.text), "provider": "fallback"}


@router.post("/generate-cards")
async def generate_cards(body: TextIn, user: User = Depends(get_current_user)):
    gemini = await ask_gemini(
        "Create 3 concise revision cards as plain JSON array with question, answer, card_type, topic. "
        f"Topic: {body.topic}\nTitle: {body.title}\nContent:\n{body.text[:5000]}"
    )
    if gemini:
        return {"raw": gemini, "provider": "gemini"}
    summary = cheap_summary(body.text, 2)
    return {
        "cards": [
            {"question": f"What is the key idea of {body.title or body.topic}?", "answer": summary, "card_type": "concept", "topic": body.topic},
            {"question": f"Explain {body.title or body.topic} like you are walking.", "answer": summary[:240], "card_type": "walk", "topic": body.topic},
        ],
        "provider": "fallback" if not settings.gemini_api_key else "gemini-ready-fallback",
    }


@router.post("/generate-email-preview")
async def generate_email_preview(body: TextIn, user: User = Depends(get_current_user)):
    gemini = await ask_gemini(
        f"Write a short CodeShelf daily coding revision reminder email for {user.name}. "
        f"Include 3 revision tasks, 1 weak topic, and a CTA link. Topic context: {body.topic}. Notes: {body.text[:2500]}"
    )
    if gemini:
        return {"subject": f"{user.name}, today's coding revision is ready", "body": gemini, "provider": "gemini"}
    return {
        "subject": f"{user.name}, today's coding revision is ready",
        "body": f"Today you should revise:\n1. {body.topic}\n2. One weak problem\n3. One mistake\n\nStart here: {settings.frontend_url}/revision/today",
        "provider": "fallback",
    }


@router.post("/explain-for-walk-mode")
async def explain_for_walk_mode(body: TextIn, user: User = Depends(get_current_user)):
    gemini = await ask_gemini(
        "Explain this in a short audio-friendly way for someone walking. Keep it under 80 words.\n"
        f"Title: {body.title}\nContent:\n{body.text[:3000]}"
    )
    if gemini:
        return {"explanation": gemini, "provider": "gemini"}
    return {"explanation": cheap_summary(body.text, 2), "provider": "fallback"}
