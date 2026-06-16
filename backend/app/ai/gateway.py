"""AI gateway: OpenRouter-compatible client with a free-first model fallback
chain, degrading to a deterministic rule-based responder when no API key is
configured (so the product runs end-to-end with zero spend).

This is the ONLY place in the backend that talks to an LLM.
"""

from __future__ import annotations

import httpx

from app.config import settings
from app.ai.schemas import CompletionRequest, CompletionResponse


class AIGateway:
    def __init__(self) -> None:
        self._key = settings.openrouter_api_key
        self._base = settings.openrouter_base_url.rstrip("/")
        # Free models first, then any configured paid fallbacks.
        self._models = settings.free_model_list + settings.fallback_model_list

    @property
    def enabled(self) -> bool:
        """True when a real LLM is configured; False = rule-based mode."""
        return bool(self._key) and bool(self._models)

    async def complete(self, req: CompletionRequest) -> CompletionResponse:
        if not self.enabled:
            return self._rule_based(req)

        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=60) as client:
            for idx, model in enumerate(self._models):
                try:
                    content = await self._call_model(client, model, req)
                    return CompletionResponse(
                        content=content,
                        model=model,
                        confidence=0.75,
                        used_fallback=idx > 0,
                    )
                except Exception as exc:  # try the next model on any failure
                    last_error = exc
                    continue

        # Every model failed — fall back to rule-based rather than erroring out.
        resp = self._rule_based(req)
        resp.used_fallback = True
        resp.reasoning = (
            f"All configured models failed ({last_error}); used rule-based fallback."
        )
        return resp

    async def _call_model(
        self, client: httpx.AsyncClient, model: str, req: CompletionRequest
    ) -> str:
        r = await client.post(
            f"{self._base}/chat/completions",
            headers={
                "Authorization": f"Bearer {self._key}",
                "HTTP-Referer": "https://stratum.app",
                "X-Title": "STRATUM",
            },
            json={
                "model": model,
                "messages": [m.model_dump() for m in req.messages],
                "temperature": req.temperature,
                "max_tokens": req.max_tokens,
            },
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]

    def _rule_based(self, req: CompletionRequest) -> CompletionResponse:
        """Deterministic, no-key responder. Honest about being non-LLM and low
        confidence; real coaching logic is layered on per-feature."""
        last_user = next(
            (m.content for m in reversed(req.messages) if m.role == "user"),
            "",
        )
        snippet = last_user.strip().splitlines()[0][:160] if last_user else ""
        content = (
            "AI is running in rule-based mode (no model key configured). "
            "Add OPENROUTER_API_KEY to enable model-generated answers. "
            + (f'Received: "{snippet}".' if snippet else "")
        )
        return CompletionResponse(
            content=content,
            model="rule-based",
            confidence=0.2,
            reasoning="No OPENROUTER_API_KEY set; deterministic fallback.",
        )


gateway = AIGateway()
