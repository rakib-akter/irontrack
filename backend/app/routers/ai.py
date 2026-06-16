"""AI endpoints — proxy to the gateway (free-first + fallback + rule-based)."""

from __future__ import annotations

from fastapi import APIRouter

from app.ai.gateway import gateway
from app.ai.schemas import CompletionRequest, CompletionResponse

router = APIRouter(prefix="/ai", tags=["ai"])


class AIStatus(dict):
    pass


@router.get("/status")
def status() -> dict:
    """Whether a real model is configured, without leaking the key."""
    return {
        "mode": "model" if gateway.enabled else "rule-based",
        "models": gateway._models,  # noqa: SLF001 — intentional, names only
    }


@router.post("/complete", response_model=CompletionResponse)
async def complete(req: CompletionRequest) -> CompletionResponse:
    return await gateway.complete(req)
