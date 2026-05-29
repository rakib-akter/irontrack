import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = (await getUserId())!; // layout guarantees auth

  const [lifts, goals] = await Promise.all([
    prisma.liftEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
    }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  // Summarize per exercise.
  const byExercise = new Map<
    string,
    { count: number; best1RM: number; unit: string; lastDate: Date }
  >();
  for (const l of lifts) {
    const orm = estimateOneRepMax(l.weight, l.reps);
    const cur = byExercise.get(l.exercise);
    if (!cur) {
      byExercise.set(l.exercise, {
        count: 1,
        best1RM: orm,
        unit: l.unit,
        lastDate: l.performedAt,
      });
    } else {
      cur.count += 1;
      cur.best1RM = Math.max(cur.best1RM, orm);
      if (l.performedAt > cur.lastDate) cur.lastDate = l.performedAt;
    }
  }

  const goalByExercise = new Map(goals.map((g) => [g.exercise, g]));
  const exercises = [...byExercise.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-6">
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
  );
}
