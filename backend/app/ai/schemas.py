"""Contracts for the AI gateway. Every AI response is normalized to this shape
so callers never depend on a specific provider."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str  # "system" | "user" | "assistant"
    content: str


class Citation(BaseModel):
    source_slug: str
    title: str
    authors: str
    year: int | None = None


class CompletionRequest(BaseModel):
    messages: list[Message]
    temperature: float = 0.3
    max_tokens: int = 800


class CompletionResponse(BaseModel):
    content: str
    model: str  # which model answered, or "rule-based"
    confidence: float = Field(ge=0, le=1)
    reasoning: str | None = None
    citations: list[Citation] = []
    used_fallback: bool = False
