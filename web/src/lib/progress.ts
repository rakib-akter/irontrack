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
