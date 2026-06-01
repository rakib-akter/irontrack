import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = (await getUserId())!; // layout guarantees auth

  const [lifts, goals, bodyWeights] = await Promise.all([
    prisma.liftEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
    }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.bodyWeightEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
  ]);

  // Body weight summary: current = latest, change = latest - first.
  const currentBW = bodyWeights.length
    ? bodyWeights[bodyWeights.length - 1]
    : null;
  const firstBW = bodyWeights.length ? bodyWeights[0] : null;
  const bwChange =
    currentBW && firstBW ? currentBW.weight - firstBW.weight : null;

  // Summarize per exercise. Lifts are sorted newest-first, so the first time we
  // see an exercise is its most recent set.
  const byExercise = new Map<
    string,
    {
      count: number;
      best1RM: number;
      unit: string;
      latestWeight: number;
      latestReps: number;
    }
  >();
  for (const l of lifts) {
    const orm = estimateOneRepMax(l.weight, l.reps);
    const cur = byExercise.get(l.exercise);
    if (!cur) {
      byExercise.set(l.exercise, {
        count: 1,
        best1RM: orm,
        unit: l.unit,
        latestWeight: l.weight,
        latestReps: l.reps,
      });
    } else {
      cur.count += 1;
      cur.best1RM = Math.max(cur.best1RM, orm);
    }
  }

  const goalByExercise = new Map(goals.map((g) => [g.exercise, g]));
  const exercises = [...byExercise.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-8">
      {/* Top summary: body weight + headline stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/bodyweight"
          className="card transition-colors hover:border-blue-600"
        >
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Body weight
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-400">
            {currentBW ? `${currentBW.weight} ${currentBW.unit}` : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {bwChange === null
              ? "Log your weight to start tracking"
              : `${bwChange > 0 ? "+" : ""}${Math.round(bwChange * 10) / 10} ${currentBW?.unit} since start`}
          </p>
        </Link>

        <div className="card">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Exercises tracked
          </p>
          <p className="mt-1 text-3xl font-bold">{exercises.length}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {lifts.length} total set{lifts.length === 1 ? "" : "s"} logged
          </p>
        </div>

        <div className="card">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Active goals
          </p>
          <p className="mt-1 text-3xl font-bold">{goals.length}</p>
          <p className="mt-1 text-xs text-zinc-500">
            <Link href="/goals" className="text-emerald-400 hover:underline">
              Manage goals →
            </Link>
          </p>
        </div>
      </div>

      {/* Lifts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your lifts</h1>
          <Link href="/log" className="btn-primary">
            + Log a lift
          </Link>
        </div>

        {exercises.length === 0 ? (
          <div className="card text-center text-zinc-400">
            <p className="text-lg">No lifts logged yet.</p>
            <p className="mt-1 text-sm">
              Log your first set and your strength graph starts building.
            </p>
            <Link href="/log" className="btn-primary mt-4 inline-flex">
              Log your first lift
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {exercises.map(([key, s]) => {
              const goal = goalByExercise.get(key);
              const goal1RM = goal
                ? estimateOneRepMax(goal.targetWeight, goal.targetReps)
                : null;
              const pct = goal1RM
                ? Math.min(100, Math.round((s.best1RM / goal1RM) * 100))
                : null;
              return (
                <Link
                  key={key}
                  href={`/exercise/${encodeURIComponent(key)}`}
                  className="card transition-colors hover:border-emerald-600"
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold">
                      {displayExercise(key)}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {s.count} session{s.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-emerald-400">
                    {Math.round(s.best1RM)}{" "}
                    <span className="text-base font-normal text-zinc-400">
                      {s.unit} est. 1RM
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Last lifted: {s.latestWeight} {s.unit} × {s.latestReps}
                  </p>
                  {pct !== null && goal && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-zinc-400">
                        <span>
                          Goal: {goal.targetWeight} {goal.unit}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
