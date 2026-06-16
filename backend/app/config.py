"""Runtime configuration, loaded from environment / .env."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Service
    app_name: str = "STRATUM Intelligence Service"
    environment: str = "development"
    # Comma-separated origins allowed to call this service (the Next.js app).
    cors_origins: str = "http://localhost:3000"

    # Supabase auth (JWT verification). Optional until Phase 0c.
    supabase_jwt_secret: str | None = None
    supabase_url: str | None = None

    # AI gateway (OpenRouter-compatible). Optional — without a key the gateway
    # falls back to a deterministic rule-based responder.
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # Free models tried in order, then any paid fallbacks.
    ai_free_models: str = (
        "meta-llama/llama-3.3-70b-instruct:free,"
        "deepseek/deepseek-chat:free,"
        "qwen/qwen-2.5-72b-instruct:free"
    )
    ai_fallback_models: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def free_model_list(self) -> list[str]:
        return [m.strip() for m in self.ai_free_models.split(",") if m.strip()]

    @property
    def fallback_model_list(self) -> list[str]:
        return [m.strip() for m in self.ai_fallback_models.split(",") if m.strip()]


settings = Settings()
