// Coach memory: what the coach "knows" about the lifter, derived from their
// data so the coaching feels personalized and improves as more is logged.
// Persisted to CoachProfile.memory so it can accrue user-set preferences later.

import { displayExercise } from "@/lib/exercises";
import { muscleForExercise } from "@/lib/exerciseCatalog";
import { startOfWeek } from "@/lib/progress";
import type { ExerciseState } from "./planner";

export interface CoachMemory {
  strengths: string[];
  weakPoints: string[];
  weeklySessions: number;
  totalSessions: number;
  bullets: string[]; // human-readable summary
  updatedAt: string;
}

interface LiftLite {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  performedAt: Date;
}

const DAY_MS = 86_400_000;

export function deriveMemory(
  exercises: ExerciseState[],
  lifts: LiftLite[],
): CoachMemory {
  // Strengths: top lifts by estimated 1RM.
  const strengths = [...exercises]
    .sort((a, b) => b.best1RM - a.best1RM)
    .slice(0, 2)
    .map((e) => displayExercise(e.key));

  // Weak points: plateaued lifts + neglected major muscle groups (14 days).
  const plateaued = exercises
    .filter((e) => e.plateau)
    .map((e) => `${displayExercise(e.key)} (plateaued)`);

  const cutoff = Date.now() - 14 * DAY_MS;
  const recentMuscles = new Set(
    lifts
      .filter((l) => l.performedAt.getTime() >= cutoff)
      .map((l) => muscleForExercise(l.exercise)),
  );
  const neglected = ["Chest", "Back", "Legs"]
    .filter((m) => !recentMuscles.has(m as ReturnType<typeof muscleForExercise>))
    .map((m) => `${m} undertrained (14d)`);

  const weakPoints = [...plateaued, ...neglected];

  // Compliance: distinct training days recently.
  const recentDays = new Set(
    lifts
      .filter((l) => l.performedAt.getTime() >= cutoff)
      .map((l) => l.performedAt.toISOString().slice(0, 10)),
  ).size;
  const weeklySessions = Math.round((recentDays / 2) * 10) / 10;

  const thisWeekStart = startOfWeek();
  const thisWeekDays = new Set(
    lifts
      .filter((l) => l.performedAt >= thisWeekStart)
      .map((l) => l.performedAt.toISOString().slice(0, 10)),
  ).size;

  const totalSessions = exercises.reduce((s, e) => s + e.sessions, 0);

  const bullets: string[] = [];
  if (strengths.length)
    bullets.push(`Strongest lifts: ${strengths.join(" and ")}.`);
  if (weakPoints.length)
    bullets.push(`Focus areas: ${weakPoints.join(", ")}.`);
  bullets.push(
    `Training ~${weeklySessions} sessions/week lately (${thisWeekDays} so far this week).`,
  );

  return {
    strengths,
    weakPoints,
    weeklySessions,
    totalSessions,
    bullets,
    updatedAt: new Date().toISOString(),
  };
}
