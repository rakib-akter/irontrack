import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { strengthRatePerWeek, type ProgressPoint } from "@/lib/progress";
import { generatePlan, type ExerciseState, type GoalType } from "@/lib/coach/planner";
import ProfileForm from "@/components/coach/ProfileForm";
import CoachPlan from "@/components/coach/CoachPlan";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const [profile, lifts] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.liftEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
  ]);

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
  );

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
              }
            : null
        }
      />

      <CoachPlan plan={plan} />
    </div>
  );
}
