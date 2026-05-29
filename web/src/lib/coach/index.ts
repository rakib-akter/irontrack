import { MockCoach } from "./mockCoach";
import type { Coach } from "./types";

export * from "./types";

/**
 * Returns the active coaching engine.
 *
 * Today this is a deterministic, rule-based coach (no external API, no keys
 * needed). When you're ready to use real AI, implement a new `Coach` (e.g.
 * `ClaudeCoach` calling the Anthropic API) and switch on an env var here —
 * nothing else in the app needs to change because everything depends only on
 * the `Coach` interface and `CoachResult`.
 *
 * Example of the future swap:
 *   if (process.env.AI_PROVIDER === "claude") return new ClaudeCoach();
 */
export function getCoach(): Coach {
  return new MockCoach();
}
