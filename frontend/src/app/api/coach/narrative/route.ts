import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/http";
import { estimateOneRepMax } from "@/lib/strength";
import { strengthRatePerWeek, type ProgressPoint } from "@/lib/progress";
import {
  generatePlan,
  type ExerciseState,
  type GoalType,
} from "@/lib/coach/planner";
import { buildCoachNarrative } from "@/lib/coach/narrative";
import { recoveryScore } from "@/lib/recovery";
import { retrieve } from "@/lib/research/retrieve";
import { aiEnabled } from "@/lib/ai/openrouter";

// Free models can be slow; give the function room (Vercel caps may apply).
export const maxDuration = 30;

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();
    if (!aiEnabled()) return ok({ text: null, enabled: false });

    const cutoff = new Date(Date.now() - 14 * 86_400_000);
    const [profile, lifts, recoveryLogs] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.liftEntry.findMany({ where: { userId }, orderBy: { performedAt: "asc" } }),
      prisma.recoveryLog.findMany({ where: { userId, date: { gte: cutoff } } }),
    ]);

    // Per-exercise state (same as the coach page).
    const byExercise = new Map<string, { unit: string; best1RM: number; points: ProgressPoint[] }>();
    for (const l of lifts) {
      const orm = estimateOneRepMax(l.weight, l.reps);
      const pt: ProgressPoint = { weight: l.weight, reps: l.reps, sets: l.sets, performedAt: l.performedAt };
      const cur = byExercise.get(l.exercise);
      if (!cur) byExercise.set(l.exercise, { unit: l.unit, best1RM: orm, points: [pt] });
      else {
        cur.best1RM = Math.max(cur.best1RM, orm);
        cur.points.push(pt);
      }
    }
    const exercises: ExerciseState[] = [...byExercise.entries()].map(([key, v]) => {
      const rate = strengthRatePerWeek(v.points);
      return {
        key,
        unit: v.unit,
        best1RM: v.best1RM,
        sessions: v.points.length,
        ratePerWeek: rate,
        plateau: v.points.length >= 4 && rate !== null && Math.abs(rate) < 0.5,
      };
    });

    const recScores = recoveryLogs
      .map((l) => recoveryScore(l))
      .filter((s): s is number => s !== null);
    const recovery = {
      avgScore: recScores.length ? recScores.reduce((a, b) => a + b, 0) / recScores.length : null,
      sampleSize: recScores.length,
    };

    const plan = await generatePlan(
      {
        primaryGoal: (profile?.primaryGoal as GoalType | null) ?? null,
        daysPerWeek: profile?.daysPerWeek ?? null,
        trainingLevel: profile?.trainingLevel ?? null,
        units: profile?.units ?? "lb",
      },
      exercises,
      recovery,
    );

    // Retrieve grounding evidence for the narrative.
    const chunks = await retrieve(
      `${plan.focus} training volume recovery progressive overload protein`,
      4,
    );
    const evidence = chunks.map((c) => ({
      claim: c.content,
      authors: c.citation.authors,
      year: c.citation.year,
    }));

    const narrative = await buildCoachNarrative({
      focus: plan.focus,
      recommendations: plan.recommendations.map((r) => ({
        title: r.title,
        detail: r.detail,
      })),
      evidence,
    });

    return ok({
      text: narrative?.text ?? null,
      model: narrative?.model ?? null,
      enabled: true,
    });
  } catch (e) {
    return handleError(e);
  }
}
