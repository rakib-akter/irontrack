// Server-side OpenRouter client. Tries free models first, falls back across the
// list, and returns null if no key is configured or all models fail — callers
// then use their rule-based output, so the app works with or without AI.
//
// Lives in Next (not FastAPI) so the whole app deploys to Vercel as one unit.
// On a TLS-intercepting dev machine, run with NODE_OPTIONS=--use-system-ca.
// Server-only: it reads OPENROUTER_API_KEY (never a NEXT_PUBLIC var), so the
// key is never exposed to the client.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

export function aiEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

function modelList(): string[] {
  const env = process.env.OPENROUTER_MODELS;
  const free = env
    ? env.split(",").map((m) => m.trim()).filter(Boolean)
    : DEFAULT_FREE_MODELS;
  const fallback = (process.env.OPENROUTER_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [...free, ...fallback];
}

export interface CompletionResult {
  content: string;
  model: string;
}

/** Chat completion via OpenRouter. Returns null when unavailable. */
export async function chatComplete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<CompletionResult | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const base = (
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
  ).replace(/\/$/, "");

  for (const model of modelList()) {
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://stratum.app",
          "X-Title": "STRATUM",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 600,
        }),
        // Don't let a slow free model hang a request forever.
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (content && content.trim()) return { content: content.trim(), model };
    } catch {
      // try the next model
    }
  }
  return null;
}
