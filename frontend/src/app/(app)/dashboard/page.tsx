import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise } from "@/lib/exercises";
import {
  volumeOf,
  startOfWeek,
  projectedPRDate,
  type ProgressPoint,
} from "@/lib/progress";
import {
  muscleForExercise,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/lib/exerciseCatalog";
import { generateInsights } from "@/lib/insights";
import InsightsPanel from "@/components/InsightsPanel";

export const dynamic = "force-dynamic";

function shortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const [lifts, goals, bodyWeights, bwGoal] = await Promise.all([
    prisma.liftEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
    }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.bodyWeightEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
    prisma.bodyWeightGoal.findUnique({ where: { userId } }),
  ]);

  // Body weight summary.
  const currentBW = bodyWeights.length
    ? bodyWeights[bodyWeights.length - 1]
    : null;
  const firstBW = bodyWeights.length ? bodyWeights[0] : null;
  const bwChange =
    currentBW && firstBW ? currentBW.weight - firstBW.weight : null;

  // Per-exercise summary + projection. Lifts are newest-first.
  type Summary = {
    count: number;
    best1RM: number;
    unit: string;
    latestWeight: number;
    latestReps: number;
    points: ProgressPoint[];
  };
  const byExercise = new Map<string, Summary>();
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
      byExercise.set(l.exercise, {
        count: 1,
        best1RM: orm,
        unit: l.unit,
        latestWeight: l.weight,
        latestReps: l.reps,
        points: [point],
      });
    } else {
      cur.count += 1;
      cur.best1RM = Math.max(cur.best1RM, orm);
      cur.points.push(point);
    }
  }
  const goalByExercise = new Map(goals.map((g) => [g.exercise, g]));
  const exercises = [...byExercise.entries()].sort(
    (a, b) => b[1].best1RM - a[1].best1RM,
  );

  // Strength score = sum of best estimated 1RMs across lifts.
  const strengthScore = Math.round(
    exercises.reduce((s, [, v]) => s + v.best1RM, 0),
  );
  const scoreUnit = exercises[0]?.[1].unit ?? "lb";

  // This week's volume, total and by muscle group.
  const weekStart = startOfWeek();
  const weekByMuscle = new Map<MuscleGroup, number>();
  let weekVolume = 0;
  for (const l of lifts) {
    if (l.performedAt < weekStart) continue;
    const v = volumeOf(l);
    weekVolume += v;
    const m = muscleForExercise(l.exercise);
    weekByMuscle.set(m, (weekByMuscle.get(m) ?? 0) + v);
  }
  const maxMuscle = Math.max(1, ...MUSCLE_GROUPS.map((m) => weekByMuscle.get(m) ?? 0));

  const insights = generateInsights(
    lifts.map((l) => ({
      exercise: l.exercise,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      unit: l.unit,
      performedAt: l.performedAt,
    })),
  );

  return (
    <div className="space-y-8">
      {/* Strength score hero */}
      <div className="glass p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Strength score
        </p>
        <p className="mt-1 text-5xl font-bold tracking-tight">
          {strengthScore.toLocaleString()}{" "}
          <span className="text-xl font-normal text-fg-muted">{scoreUnit}</span>
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Sum of your best estimated 1RMs across{" "}
          {exercises.length} lift{exercises.length === 1 ? "" : "s"} — it climbs
          as you get stronger.
        </p>
      </div>

      {/* AI insights */}
      <InsightsPanel insights={insights} />

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/bodyweight"
          className="card transition-colors hover:border-accent"
        >
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            Body weight
          </p>
          <p className="mt-1 text-3xl font-bold text-accent">
            {currentBW ? `${currentBW.weight} ${currentBW.unit}` : "—"}
          </p>
          <p className="mt-1 text-xs text-fg-subtle">
            {bwChange === null
              ? "Log your weight to start tracking"
              : `${bwChange > 0 ? "+" : ""}${Math.round(bwChange * 10) / 10} ${currentBW?.unit} since start`}
          </p>
        </Link>

        <div className="card">
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            Volume this week
          </p>
          <p className="mt-1 text-3xl font-bold">
            {weekVolume.toLocaleString()}{" "}
            <span className="text-base font-normal text-fg-muted">
              {scoreUnit}
            </span>
          </p>
          <p className="mt-1 text-xs text-fg-subtle">weight × reps × sets</p>
        </div>

        <div className="card">
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            Active goals
          </p>
          <p className="mt-1 text-3xl font-bold">{goals.length}</p>
          <p className="mt-1 text-xs text-fg-subtle">
            <Link href="/goals" className="text-accent hover:underline">
              Manage goals →
            </Link>
          </p>
        </div>
      </div>

      {/* Muscle-group progression (this week) */}
      <div className="card">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Muscle groups · this week
        </h2>
        <div className="mt-4 space-y-3">
          {MUSCLE_GROUPS.map((m) => {
            const v = weekByMuscle.get(m) ?? 0;
            const pct = Math.round((v / maxMuscle) * 100);
            return (
              <div key={m} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-fg-muted">{m}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${v > 0 ? Math.max(4, pct) : 0}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-fg-subtle">
                  {v > 0 ? v.toLocaleString() : "—"}
                </span>
              </div>
            );
          })}
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
          <div className="card text-center text-fg-muted">
            <p className="text-lg">No lifts logged yet.</p>
            <p className="mt-1 text-sm">
              Log your first set and your strength engine starts building.
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
              const prDate = projectedPRDate(s.points, 5);
              return (
                <Link
                  key={key}
                  href={`/exercise/${encodeURIComponent(key)}`}
                  className="card transition-colors hover:border-accent"
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold">
                      {displayExercise(key)}
                    </h2>
                    <span className="text-xs text-fg-subtle">
                      {s.count} session{s.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-accent">
                    {Math.round(s.best1RM)}{" "}
                    <span className="text-base font-normal text-fg-muted">
                      {s.unit} est. 1RM
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-fg-subtle">
                    Last lifted: {s.latestWeight} {s.unit} × {s.latestReps}
                    {prDate
                      ? ` · on pace for +5 ${s.unit} by ${shortDate(prDate)}`
                      : ""}
                  </p>
                  {pct !== null && goal && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-fg-muted">
                        <span>
                          Goal: {goal.targetWeight} {goal.unit}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent"
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
