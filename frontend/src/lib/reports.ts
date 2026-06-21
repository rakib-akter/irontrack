// Intelligence reports: synthesize every pillar (strength, nutrition, body
// composition, recovery) into a period report with wins, misses, predictions,
// and next actions. Orchestrates the existing per-pillar engines.

import { estimateOneRepMax } from "./strength";
import {
  prHistory,
  strengthRatePerWeek,
  projectedPRDate,
  volumeOf,
  type ProgressPoint,
} from "./progress";
import { displayExercise } from "./exercises";
import { sumNutrients, type NutrientTotals } from "./nutrition";
import { nutritionAdvice } from "./nutrition/advice";
import { compositionChange } from "./bodycomp";
import { recoveryScore, deloadSuggestion } from "./recovery";

export type ReportPeriod = "daily" | "weekly" | "monthly";

const DAY_MS = 86_400_000;
const WINDOW: Record<ReportPeriod, number> = { daily: 1, weekly: 7, monthly: 30 };

export interface ReportLift {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  unit: string;
  performedAt: Date;
}
export interface ReportGoal {
  exercise: string;
  targetWeight: number;
  targetReps: number;
}
export interface ReportMeasurement {
  weight: number | null;
  bodyFatPct: number | null;
  performedAt: Date;
}
export type ReportNutritionRow = Partial<
  Record<keyof NutrientTotals, number | null>
> & { loggedAt: Date };
export interface ReportRecovery {
  date: Date;
  sleepHours: number | null;
  sleepQuality: number | null;
  stress: number | null;
  energy: number | null;
  soreness: number | null;
}

export interface ReportInput {
  lifts: ReportLift[];
  goals: ReportGoal[];
  measurements: ReportMeasurement[];
  nutrition: ReportNutritionRow[];
  recovery: ReportRecovery[];
  proteinTarget?: number | null;
}

export interface IntelligenceReport {
  period: ReportPeriod;
  periodStartISO: string;
  periodEndISO: string;
  wins: string[];
  misses: string[];
  predictions: string[];
  nextActions: string[];
}

export function generateReport(
  period: ReportPeriod,
  input: ReportInput,
): IntelligenceReport {
  const now = Date.now();
  const windowDays = WINDOW[period];
  const cutoff = new Date(now - windowDays * DAY_MS);
  const priorCutoff = new Date(now - 2 * windowDays * DAY_MS);

  const wins: string[] = [];
  const misses: string[] = [];
  const predictions: string[] = [];
  const nextActions: string[] = [];

  // ---------- Strength ----------
  const byExercise = new Map<string, { unit: string; points: ProgressPoint[] }>();
  for (const l of input.lifts) {
    const arr = byExercise.get(l.exercise) ?? { unit: l.unit, points: [] };
    arr.points.push({ weight: l.weight, reps: l.reps, sets: l.sets, performedAt: l.performedAt });
    byExercise.set(l.exercise, arr);
  }

  let prCount = 0;
  const prNames: string[] = [];
  for (const [key, v] of byExercise) {
    const prsInPeriod = prHistory(v.points).filter((p) => p.performedAt >= cutoff);
    if (prsInPeriod.length > 0) {
      prCount += prsInPeriod.length;
      prNames.push(displayExercise(key));
    }
    // Plateau
    if (v.points.length >= 4) {
      const rate = strengthRatePerWeek(v.points);
      if (rate !== null && Math.abs(rate) < 0.5) {
        misses.push(`${displayExercise(key)} has stalled — its estimated 1RM is flat.`);
        nextActions.push(`Add a back-off set or take a lighter week on ${displayExercise(key)}.`);
      }
    }
  }
  if (prCount > 0) {
    wins.push(
      `Set ${prCount} new estimated-1RM PR${prCount === 1 ? "" : "s"} (${prNames.slice(0, 3).join(", ")}).`,
    );
  }

  // Projected goal hits.
  const goalByExercise = new Map(input.goals.map((g) => [g.exercise, g]));
  for (const [key, v] of byExercise) {
    const goal = goalByExercise.get(key);
    if (!goal) continue;
    const goal1RM = estimateOneRepMax(goal.targetWeight, goal.targetReps);
    const best = Math.max(...v.points.map((p) => estimateOneRepMax(p.weight, p.reps)));
    if (best >= goal1RM) continue;
    const rate = strengthRatePerWeek(v.points);
    if (rate && rate > 0) {
      const weeks = Math.ceil((goal1RM - best) / rate);
      if (weeks <= 104) {
        predictions.push(
          `${displayExercise(key)} projected to hit ${goal.targetWeight} ${v.unit} in ~${weeks} week${weeks === 1 ? "" : "s"}.`,
        );
      }
    } else {
      const prDate = projectedPRDate(v.points, 5);
      if (prDate)
        predictions.push(
          `On pace for a ${displayExercise(key)} PR (+5 ${v.unit}) by ${prDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`,
        );
    }
  }

  // Volume this period vs prior.
  const volIn = sumVolume(input.lifts, cutoff, new Date(now));
  const volPrior = sumVolume(input.lifts, priorCutoff, cutoff);
  if (volPrior > 0 && volIn > 0) {
    const pct = Math.round(((volIn - volPrior) / volPrior) * 100);
    if (pct >= 10) wins.push(`Total training volume up ${pct}% vs the previous ${period}.`);
    else if (pct <= -20) misses.push(`Training volume down ${Math.abs(pct)}% vs the previous ${period}.`);
  }

  // ---------- Nutrition ----------
  const nutInPeriod = input.nutrition.filter((n) => n.loggedAt >= cutoff);
  const daysLogged = new Set(nutInPeriod.map((n) => n.loggedAt.toISOString().slice(0, 10))).size;
  if (daysLogged > 0) {
    const totals = sumNutrients(nutInPeriod);
    const avg = scaleTotals(totals, 1 / daysLogged);
    const advice = nutritionAdvice(avg, daysLogged, input.proteinTarget, 30);
    for (const a of advice.items) {
      if (a.tone === "warning") misses.push(a.text);
      else nextActions.push(a.text);
    }
    if (input.proteinTarget && avg.proteinG >= 0.95 * input.proteinTarget) {
      wins.push(`Hit your protein target on average (${Math.round(avg.proteinG)} g/day).`);
    }
  }

  // ---------- Body composition ----------
  const measWithBf = input.measurements
    .filter((m) => m.performedAt >= cutoff && m.weight && m.bodyFatPct !== null)
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
  if (measWithBf.length >= 2) {
    const c = compositionChange(
      { weight: measWithBf[0].weight!, bodyFatPct: measWithBf[0].bodyFatPct },
      { weight: measWithBf[measWithBf.length - 1].weight!, bodyFatPct: measWithBf[measWithBf.length - 1].bodyFatPct },
    );
    if (c.fatDelta !== null && c.fatDelta < -0.3) wins.push(c.summary);
    else if (c.fatDelta !== null && c.fatDelta > 0.5) misses.push(c.summary);
  }

  // ---------- Recovery ----------
  const recInPeriod = input.recovery.filter((r) => r.date >= cutoff);
  const recScores = recInPeriod
    .map((r) => recoveryScore(r))
    .filter((s): s is number => s !== null);
  if (recScores.length >= 2) {
    const avg = recScores.reduce((a, b) => a + b, 0) / recScores.length;
    if (avg >= 75) wins.push(`Recovery has been strong (avg ${Math.round(avg)}).`);
    else if (avg < 55) misses.push(`Recovery has been low (avg ${Math.round(avg)}).`);
    const deload = deloadSuggestion(recScores);
    if (deload) nextActions.push("Take a deload week — cut volume ~30% and prioritize sleep.");
  }

  if (wins.length === 0) wins.push("Keep logging — your wins will show up here.");
  if (nextActions.length === 0) nextActions.push("Stay consistent and keep progressively overloading.");

  return {
    period,
    periodStartISO: cutoff.toISOString(),
    periodEndISO: new Date(now).toISOString(),
    wins: dedupe(wins).slice(0, 5),
    misses: dedupe(misses).slice(0, 5),
    predictions: dedupe(predictions).slice(0, 5),
    nextActions: dedupe(nextActions).slice(0, 5),
  };
}

function sumVolume(lifts: ReportLift[], from: Date, to: Date): number {
  return lifts
    .filter((l) => l.performedAt >= from && l.performedAt < to)
    .reduce((s, l) => s + volumeOf(l), 0);
}

function scaleTotals(t: NutrientTotals, f: number): NutrientTotals {
  const out = { ...t };
  for (const k of Object.keys(out) as (keyof NutrientTotals)[]) out[k] = out[k] * f;
  return out;
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}
