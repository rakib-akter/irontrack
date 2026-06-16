import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise } from "@/lib/exercises";
import GoalForm from "@/components/GoalForm";
import GoalList, { type GoalRow } from "@/components/GoalList";

export const dynamic = "force-dynamic";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const { exercise: prefill } = await searchParams;

  const [goals, lifts] = await Promise.all([
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.liftEntry.findMany({ where: { userId } }),
  ]);

  // Best 1RM per exercise for progress bars.
  const best = new Map<string, number>();
  for (const l of lifts) {
    const orm = estimateOneRepMax(l.weight, l.reps);
    best.set(l.exercise, Math.max(best.get(l.exercise) ?? 0, orm));
  }

  const rows: GoalRow[] = goals.map((g) => {
    const goal1RM = estimateOneRepMax(g.targetWeight, g.targetReps);
    const cur = best.get(g.exercise) ?? null;
    return {
      id: g.id,
      exercise: g.exercise,
      targetWeight: g.targetWeight,
      targetReps: g.targetReps,
      unit: g.unit,
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
      best1RM: cur,
      percent:
        cur !== null ? Math.min(100, Math.round((cur / goal1RM) * 100)) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Goals</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <GoalForm
          defaultExercise={prefill ? displayExercise(prefill) : undefined}
        />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your goals</h2>
          <GoalList goals={rows} />
        </div>
      </div>
    </div>
  );
}
