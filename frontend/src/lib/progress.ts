// Progress analytics computed from a lift's logged history: personal-record
// (PR) detection, per-rep maxes, and training volume. Pure functions — no DB,
// no side effects — so they're easy to reuse and test.

import { estimateOneRepMax } from "./strength";

export interface ProgressPoint {
  weight: number;
  reps: number;
  sets: number;
  performedAt: Date;
}

/** Total weight moved in a session: weight x reps x sets. */
export function volumeOf(p: Pick<ProgressPoint, "weight" | "reps" | "sets">) {
  return p.weight * p.reps * p.sets;
}

export interface PRRecord {
  performedAt: Date;
  weight: number;
  reps: number;
  oneRM: number; // estimated 1RM for this session
}

/**
 * The history of estimated-1RM personal records: every session whose estimated
 * 1RM beat everything logged before it. Returned newest-first.
 */
export function prHistory(points: ProgressPoint[]): PRRecord[] {
  const sorted = [...points].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime(),
  );
  const prs: PRRecord[] = [];
  let best = 0;
  for (const p of sorted) {
    const orm = estimateOneRepMax(p.weight, p.reps);
    // Strictly greater so we only record genuine improvements.
    if (orm > best + 1e-9) {
      best = orm;
      prs.push({
        performedAt: p.performedAt,
        weight: p.weight,
        reps: p.reps,
        oneRM: orm,
      });
    }
  }
  return prs.reverse();
}

export interface RepMax {
  reps: number;
  weight: number;
  performedAt: Date;
}

/**
 * Heaviest weight lifted for each rep count (a "rep max" table), e.g. best 1RM,
 * 3RM, 5RM. Sorted by reps ascending.
 */
export function repMaxes(points: ProgressPoint[]): RepMax[] {
  const byReps = new Map<number, RepMax>();
  for (const p of points) {
    const cur = byReps.get(p.reps);
    if (!cur || p.weight > cur.weight) {
      byReps.set(p.reps, {
        reps: p.reps,
        weight: p.weight,
        performedAt: p.performedAt,
      });
    }
  }
  return [...byReps.values()].sort((a, b) => a.reps - b.reps);
}

export interface VolumeStats {
  totalVolume: number;
  sessions: number;
  bestSession: { volume: number; performedAt: Date } | null;
  lastSession: { volume: number; performedAt: Date } | null;
}

export function volumeStats(points: ProgressPoint[]): VolumeStats {
  if (points.length === 0) {
    return { totalVolume: 0, sessions: 0, bestSession: null, lastSession: null };
  }
  const sorted = [...points].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime(),
  );
  let total = 0;
  let best: VolumeStats["bestSession"] = null;
  for (const p of sorted) {
    const v = volumeOf(p);
    total += v;
    if (!best || v > best.volume) best = { volume: v, performedAt: p.performedAt };
  }
  const lastPoint = sorted[sorted.length - 1];
  return {
    totalVolume: total,
    sessions: sorted.length,
    bestSession: best,
    lastSession: {
      volume: volumeOf(lastPoint),
      performedAt: lastPoint.performedAt,
    },
  };
}

/** Midnight on the Monday of the week containing `d` (local time). */
export function startOfWeek(d: Date = new Date()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0=Sun .. 6=Sat
  const sinceMonday = (day + 6) % 7;
  date.setDate(date.getDate() - sinceMonday);
  return date;
}

/** Total volume logged since the start of the current week. */
export function currentWeekVolume(
  points: ProgressPoint[],
  now: Date = new Date(),
): number {
  const start = startOfWeek(now);
  return points
    .filter((p) => p.performedAt >= start)
    .reduce((sum, p) => sum + volumeOf(p), 0);
}

/**
 * A simple rule-based suggested weekly volume target: ~5% above the average of
 * the weeks you've actually trained this lift (encouraging gentle progressive
 * overload), rounded to a tidy number. Returns null with no data.
 *
 * This is the seam where an AI assistant can later produce a smarter,
 * individualized target — callers just consume a number.
 */
export function suggestedWeeklyVolume(points: ProgressPoint[]): number | null {
  if (points.length === 0) return null;
  const byWeek = new Map<string, number>();
  for (const p of points) {
    const key = startOfWeek(p.performedAt).toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + volumeOf(p));
  }
  const weeklyVolumes = [...byWeek.values()];
  const avg =
    weeklyVolumes.reduce((a, b) => a + b, 0) / weeklyVolumes.length;
  return Math.max(100, Math.round((avg * 1.05) / 100) * 100);
}

const DAY_MS = 86_400_000;

/** Best estimated 1RM per calendar day as [daysSinceFirst, oneRM], ascending. */
export function best1RMByDay(points: ProgressPoint[]): [number, number][] {
  const byDay = new Map<string, number>();
  for (const p of points) {
    const day = p.performedAt.toISOString().slice(0, 10);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, estimateOneRepMax(p.weight, p.reps)));
  }
  const entries = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return [];
  const t0 = new Date(`${entries[0][0]}T00:00:00`).getTime();
  return entries.map(([d, orm]) => [
    (new Date(`${d}T00:00:00`).getTime() - t0) / DAY_MS,
    orm,
  ]);
}

/** Linear progression rate of best estimated 1RM, per week. null if there
 * isn't enough spread to fit a line. */
export function strengthRatePerWeek(points: ProgressPoint[]): number | null {
  const series = best1RMByDay(points);
  if (series.length < 2) return null;
  const xs = series.map((s) => s[0]);
  const ys = series.map((s) => s[1]);
  if (xs[xs.length - 1] - xs[0] <= 0) return null;
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0);
  const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return ((n * sxy - sx * sy) / denom) * 7;
}

/** Projected date to add `gain` to the current best 1RM at the current rate.
 * null if not progressing or the horizon is implausibly far (>2 years). */
export function projectedPRDate(
  points: ProgressPoint[],
  gain = 5,
): Date | null {
  const rate = strengthRatePerWeek(points);
  if (!rate || rate <= 0) return null;
  const weeks = gain / rate;
  if (weeks > 104) return null;
  return new Date(Date.now() + weeks * 7 * DAY_MS);
}
