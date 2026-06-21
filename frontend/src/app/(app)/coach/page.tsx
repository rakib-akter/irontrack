import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { strengthRatePerWeek, type ProgressPoint } from "@/lib/progress";
import { generatePlan, type ExerciseState, type GoalType } from "@/lib/coach/planner";
import { deriveMemory } from "@/lib/coach/memory";
import { recoveryScore } from "@/lib/recovery";
import ProfileForm from "@/components/coach/ProfileForm";
import CoachPlan from "@/components/coach/CoachPlan";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const recoveryCutoff = new Date(Date.now() - 14 * 86_400_000);
  const [profile, lifts, recoveryLogs] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.liftEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
    prisma.recoveryLog.findMany({
      where: { userId, date: { gte: recoveryCutoff } },
      orderBy: { date: "asc" },
    }),
  ]);

  // Recent recovery signal for the planner.
  const recoveryScores = recoveryLogs
    .map((l) => recoveryScore(l))
    .filter((s): s is number => s !== null);
  const recovery = {
    avgScore: recoveryScores.length
      ? recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length
      : null,
    sampleSize: recoveryScores.length,
  };

  // Build per-exercise state for the planner.
  const byExercise = new Map<string, { unit: string; best1RM: number; points: ProgressPoint[] }>();
  for (const l of lifts) {
    const orm = estimateOneRepMax(l.weight, l.reps);
    const point: ProgressPoint = {
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      performedAt: l.performedAt,
    };
    const cur = byExercise.get(l.exercise);
    if (!cur) {
      byExercise.set(l.exercise, { unit: l.unit, best1RM: orm, points: [point] });
    } else {
      cur.best1RM = Math.max(cur.best1RM, orm);
      cur.points.push(point);
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

  // Coach memory: derive + persist so it accrues over time.
  const memory = deriveMemory(
    exercises,
    lifts.map((l) => ({
      exercise: l.exercise,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      performedAt: l.performedAt,
    })),
  );
  const memoryJson = memory as unknown as Prisma.InputJsonValue;
  await prisma.coachProfile.upsert({
    where: { userId },
    create: { userId, memory: memoryJson },
    update: { memory: memoryJson },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Evidence-based coaching from your training history — every call cites
          the research behind it.
        </p>
      </div>

      {!profile && (
        <div className="rounded-xl border border-accent/40 bg-accent-weak p-4 text-sm text-fg">
          Set your goal and schedule below to tailor the plan to you.
        </div>
      )}

      <ProfileForm
        existing={
          profile
            ? {
                primaryGoal: profile.primaryGoal,
                trainingLevel: profile.trainingLevel,
                daysPerWeek: profile.daysPerWeek,
                units: profile.units,
                sex: profile.sex,
                heightCm: profile.heightCm,
              }
            : null
        }
      />

      {memory.bullets.length > 0 && memory.totalSessions > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
            What your coach knows
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {memory.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-fg-subtle">
            This sharpens as you log more — the plan adapts to your weak points
            and progress.
          </p>
        </div>
      )}

      <CoachPlan plan={plan} />
    </div>
  );
}
