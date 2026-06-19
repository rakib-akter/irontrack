// Rule-based strength insights surfaced on the dashboard. Pure function over the
// user's lifts. This is the seam where the AI gateway can later produce richer,
// individualized narrative insights — callers just consume Insight[].

import { startOfWeek, volumeOf, strengthRatePerWeek } from "./progress";
import { projectedPRDate } from "./progress";
import { muscleForExercise } from "./exerciseCatalog";
import { displayExercise } from "./exercises";

export interface InsightLift {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  unit: string;
  performedAt: Date;
}

export type InsightTone = "positive" | "warning" | "info";

export interface Insight {
  tone: InsightTone;
  text: string;
}

const DAY_MS = 86_400_000;

export function generateInsights(lifts: InsightLift[]): Insight[] {
  if (lifts.length === 0) return [];

  const weekStart = startOfWeek();
  const lastWeekStart = new Date(weekStart.getTime() - 7 * DAY_MS);

  // Group lifts by exercise.
  const byExercise = new Map<string, InsightLift[]>();
  for (const l of lifts) {
    const arr = byExercise.get(l.exercise) ?? [];
    arr.push(l);
    byExercise.set(l.exercise, arr);
  }

  const warnings: Insight[] = [];
  const positives: Insight[] = [];
  const info: Insight[] = [];

  for (const [exercise, entries] of byExercise) {
    const name = displayExercise(exercise);
    const unit = entries[0].unit;

    // Week-over-week volume change.
    let thisWeek = 0;
    let lastWeek = 0;
    for (const e of entries) {
      if (e.performedAt >= weekStart) thisWeek += volumeOf(e);
      else if (e.performedAt >= lastWeekStart) lastWeek += volumeOf(e);
    }
    if (lastWeek > 0 && thisWeek > 0) {
      const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
      if (pct >= 10) {
        positives.push({
          tone: "positive",
          text: `${name} volume is up ${pct}% vs last week — strong progressive overload.`,
        });
      } else if (pct <= -15) {
        warnings.push({
          tone: "warning",
          text: `${name} volume dropped ${Math.abs(pct)}% vs last week. Intentional deload, or slipping?`,
        });
      }
    }

    // Plateau detection on best 1RM.
    const points = entries.map((e) => ({
      weight: e.weight,
      reps: e.reps,
      sets: e.sets,
      performedAt: e.performedAt,
    }));
    if (entries.length >= 4) {
      const rate = strengthRatePerWeek(points);
      if (rate !== null && Math.abs(rate) < 0.5) {
        warnings.push({
          tone: "warning",
          text: `${name} has plateaued — your estimated 1RM is flat. Try a small deload or a rep/intensity change.`,
        });
      }
    }

    // Projected PR soon.
    const prDate = projectedPRDate(points, 5);
    if (prDate && prDate.getTime() - Date.now() < 42 * DAY_MS) {
      positives.push({
        tone: "positive",
        text: `On pace for a ${name} PR (+5 ${unit}) by ${prDate.toLocaleDateString(
          undefined,
          { month: "short", day: "numeric" },
        )}.`,
      });
    }
  }

  // Muscle balance this week: flag neglected major groups.
  const weekByMuscle = new Map<string, number>();
  let weekTotal = 0;
  for (const l of lifts) {
    if (l.performedAt < weekStart) continue;
    const v = volumeOf(l);
    weekTotal += v;
    weekByMuscle.set(
      muscleForExercise(l.exercise),
      (weekByMuscle.get(muscleForExercise(l.exercise)) ?? 0) + v,
    );
  }
  if (weekTotal > 0) {
    for (const major of ["Chest", "Back", "Legs"]) {
      if (!weekByMuscle.get(major)) {
        info.push({
          tone: "info",
          text: `No ${major.toLowerCase()} work logged this week — keep your training balanced.`,
        });
      }
    }
  }

  // Prioritize warnings, then positives, then info; cap to keep it scannable.
  return [...warnings, ...positives, ...info].slice(0, 5);
}
