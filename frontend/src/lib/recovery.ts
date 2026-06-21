// Recovery & readiness math. Turns a daily check-in (sleep, stress, energy,
// soreness/DOMS) into a recovery score, a readiness verdict, and actionable
// warnings (reduce volume, eat more, deload). Pure functions.

export interface RecoveryInput {
  sleepHours?: number | null;
  sleepQuality?: number | null; // 1-5
  stress?: number | null; // 1-5 (higher = worse)
  energy?: number | null; // 1-5 (higher = better)
  soreness?: number | null; // 1-5 (higher = worse, DOMS)
}

interface Component {
  value: number; // 0..1
  weight: number;
}

/** Recovery score 0-100 from whatever fields are present (weights renormalize
 * over available inputs). Returns null if nothing was logged. */
export function recoveryScore(input: RecoveryInput): number | null {
  const comps: Component[] = [];
  if (input.sleepHours != null)
    comps.push({ value: clamp01(input.sleepHours / 8), weight: 0.25 });
  if (input.sleepQuality != null)
    comps.push({ value: clamp01((input.sleepQuality - 1) / 4), weight: 0.15 });
  if (input.stress != null)
    comps.push({ value: clamp01((5 - input.stress) / 4), weight: 0.2 });
  if (input.energy != null)
    comps.push({ value: clamp01((input.energy - 1) / 4), weight: 0.2 });
  if (input.soreness != null)
    comps.push({ value: clamp01((5 - input.soreness) / 4), weight: 0.2 });

  if (comps.length === 0) return null;
  const totalWeight = comps.reduce((s, c) => s + c.weight, 0);
  const weighted = comps.reduce((s, c) => s + c.value * c.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

export type Readiness = "ready" | "caution" | "rest";

export function readiness(score: number | null): {
  level: Readiness;
  label: string;
} {
  if (score === null) return { level: "caution", label: "No data" };
  if (score >= 75) return { level: "ready", label: "Ready to train" };
  if (score >= 50) return { level: "caution", label: "Train with caution" };
  return { level: "rest", label: "Prioritize recovery" };
}

export interface RecoveryWarning {
  tone: "warning" | "info";
  text: string;
}

/** Same-day actionable warnings from a check-in. */
export function recoveryWarnings(input: RecoveryInput): RecoveryWarning[] {
  const out: RecoveryWarning[] = [];
  if (input.soreness != null && input.soreness >= 4)
    out.push({
      tone: "warning",
      text: "High soreness — cut volume on the sore muscle groups today, or train something else.",
    });
  if (input.sleepHours != null && input.sleepHours < 6)
    out.push({
      tone: "warning",
      text: "Short sleep — keep the weights but trim a set or two, and make sleep tonight a priority.",
    });
  if (input.stress != null && input.stress >= 4)
    out.push({
      tone: "info",
      text: "High stress — autoregulate by RPE and don't chase top-end loads today.",
    });
  if (input.energy != null && input.energy <= 2)
    out.push({
      tone: "info",
      text: "Low energy — make sure you're eating enough, especially carbs around training.",
    });
  return out;
}

/** Trend-based deload suggestion: several recent low-recovery days. */
export function deloadSuggestion(recentScores: number[]): RecoveryWarning | null {
  const recent = recentScores.slice(-5).filter((s) => s != null);
  if (recent.length < 3) return null;
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg < 55)
    return {
      tone: "warning",
      text: `Recovery has averaged ${Math.round(avg)} over your last ${recent.length} check-ins — a deload week would likely pay off.`,
    };
  return null;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
