"""STRATUM Intelligence Service — FastAPI app entrypoint.

Run: uvicorn app.main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analytics, ai

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI, analytics, and research service for STRATUM.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(ai.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "ai_mode": "model" if settings.openrouter_api_key else "rule-based",
    }
