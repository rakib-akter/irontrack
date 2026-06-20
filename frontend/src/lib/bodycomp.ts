// Body-composition math: US Navy body-fat estimate, lean/fat mass, trend
// weight (EWMA), and composition-change analysis. Pure functions.

export type Sex = "male" | "female" | "other";

/**
 * US Navy body-fat estimate (metric, all measurements in cm). Needs waist and
 * neck (and hip for women) plus height and sex. Returns % or null if inputs are
 * missing/out of range.
 */
export function navyBodyFat(params: {
  sex: Sex | null;
  heightCm: number | null;
  waistCm: number | null;
  neckCm: number | null;
  hipCm?: number | null;
}): number | null {
  const { sex, heightCm, waistCm, neckCm, hipCm } = params;
  if (!heightCm || !waistCm || !neckCm) return null;

  const female = sex === "female";
  // Men use (waist - neck); women use (waist + hip - neck).
  if (female) {
    if (!hipCm) return null;
    const circ = waistCm + hipCm - neckCm;
    if (circ <= 0) return null;
    const bf =
      495 /
        (1.29579 -
          0.35004 * Math.log10(circ) +
          0.221 * Math.log10(heightCm)) -
      450;
    return clampBf(bf);
  }

  // Default to the male equation for "male"/"other" (it needs no hip).
  const circ = waistCm - neckCm;
  if (circ <= 0) return null;
  const bf =
    495 /
      (1.0324 -
        0.19077 * Math.log10(circ) +
        0.15456 * Math.log10(heightCm)) -
    450;
  return clampBf(bf);
}

function clampBf(bf: number): number | null {
  if (!Number.isFinite(bf)) return null;
  if (bf < 2 || bf > 70) return null;
  return Math.round(bf * 10) / 10;
}

export function fatMass(weight: number, bodyFatPct: number): number {
  return Math.round(weight * (bodyFatPct / 100) * 10) / 10;
}

export function leanMass(weight: number, bodyFatPct: number): number {
  return Math.round(weight * (1 - bodyFatPct / 100) * 10) / 10;
}

/** Exponentially-weighted "trend weight" — smooths out daily noise. */
export function trendWeight(weights: number[], alpha = 0.1): number[] {
  const out: number[] = [];
  let prev: number | null = null;
  for (const w of weights) {
    prev = prev === null ? w : alpha * w + (1 - alpha) * prev;
    out.push(Math.round(prev * 100) / 100);
  }
  return out;
}

export interface CompositionPoint {
  weight: number;
  bodyFatPct: number | null;
}

export interface CompositionChange {
  weightDelta: number;
  fatDelta: number | null;
  leanDelta: number | null;
  summary: string;
}

/**
 * Compare two composition snapshots and describe where the change came from
 * (fat vs lean). Powers insights like "most of your loss was fat".
 */
export function compositionChange(
  start: CompositionPoint,
  end: CompositionPoint,
): CompositionChange {
  const weightDelta = Math.round((end.weight - start.weight) * 10) / 10;

  if (start.bodyFatPct === null || end.bodyFatPct === null) {
    return {
      weightDelta,
      fatDelta: null,
      leanDelta: null,
      summary:
        weightDelta === 0
          ? "Weight is stable."
          : `Weight ${weightDelta < 0 ? "down" : "up"} ${Math.abs(weightDelta)} — log waist & neck to see the fat vs lean split.`,
    };
  }

  const fatDelta =
    Math.round((fatMass(end.weight, end.bodyFatPct) - fatMass(start.weight, start.bodyFatPct)) * 10) / 10;
  const leanDelta =
    Math.round((leanMass(end.weight, end.bodyFatPct) - leanMass(start.weight, start.bodyFatPct)) * 10) / 10;

  let summary: string;
  if (weightDelta < 0) {
    const fatShare =
      Math.abs(fatDelta) + Math.abs(leanDelta) > 0
        ? Math.round((Math.abs(fatDelta) / (Math.abs(fatDelta) + Math.abs(leanDelta))) * 100)
        : 0;
    summary = `You lost ${Math.abs(weightDelta)} — about ${fatShare}% of it from fat${leanDelta >= 0 ? ", and you held or gained lean mass" : ""}.`;
  } else if (weightDelta > 0) {
    summary =
      leanDelta > Math.abs(fatDelta)
        ? `You gained ${weightDelta} — mostly lean mass (+${leanDelta}). Nice recomposition.`
        : `You gained ${weightDelta} (${fatDelta >= 0 ? "+" : ""}${fatDelta} fat, ${leanDelta >= 0 ? "+" : ""}${leanDelta} lean).`;
  } else {
    summary =
      Math.abs(fatDelta) > 0.3
        ? `Weight is stable, but composition shifted (${fatDelta >= 0 ? "+" : ""}${fatDelta} fat, ${leanDelta >= 0 ? "+" : ""}${leanDelta} lean).`
        : "Weight and composition are stable.";
  }

  return { weightDelta, fatDelta, leanDelta, summary };
}
