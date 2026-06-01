import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise, normalizeExercise } from "@/lib/exercises";
import LiftChart, { type ChartPoint } from "@/components/LiftChart";
import CoachPanel from "@/components/CoachPanel";
import LiftList, { type LiftRow } from "@/components/LiftList";
import LogLiftForm from "@/components/LogLiftForm";

export const dynamic = "force-dynamic";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ exercise: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const { exercise: raw } = await params;
  const exercise = normalizeExercise(decodeURIComponent(raw));

  const [lifts, goal] = await Promise.all([
    prisma.liftEntry.findMany({
      where: { userId, exercise },
      orderBy: { performedAt: "asc" },
    }),
    prisma.goal.findFirst({ where: { userId, exercise } }),
  ]);

  const unit = goal?.unit ?? lifts[0]?.unit ?? "lb";
  const goal1RM = goal
    ? estimateOneRepMax(goal.targetWeight, goal.targetReps)
    : null;

  // Build chart points: best estimated 1RM per day.
  const byDay = new Map<string, number>();
  for (const l of lifts) {
    const day = l.performedAt.toISOString().slice(0, 10);
    const orm = estimateOneRepMax(l.weight, l.reps);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, orm));
  }
  const chartData: ChartPoint[] = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, orm]) => ({
      date: day,
      oneRM: Math.round(orm),
      label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  const rows: LiftRow[] = [...lifts]
    .reverse()
    .map((l) => ({
      id: l.id,
      exercise: l.exercise,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      unit: l.unit,
      notes: l.notes,
      performedAt: l.performedAt.toISOString(),
    }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100">
          ← Dashboard
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{displayExercise(exercise)}</h1>
          <Link
            href={`/goals?exercise=${encodeURIComponent(exercise)}`}
            className="btn-ghost"
          >
            {goal ? "Edit goal" : "Set a goal"}
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Estimated 1-rep max over time
        </h2>
        <LiftChart data={chartData} unit={unit} goal={goal1RM} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CoachPanel exercise={exercise} />
        <div className="space-y-4">
          <div className="card">
            <h2 className="mb-2 font-semibold">Quick log</h2>
            <LogLiftForm defaultExercise={displayExercise(exercise)} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">History</h2>
        <LiftList lifts={rows} showExercise={false} />
      </div>
    </div>
  );
}
