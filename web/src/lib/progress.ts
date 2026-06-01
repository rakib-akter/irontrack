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
