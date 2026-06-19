import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { estimateOneRepMax } from "@/lib/strength";
import { displayExercise, normalizeExercise } from "@/lib/exercises";
import {
  prHistory,
  repMaxes,
  volumeStats,
  volumeOf,
  currentWeekVolume,
  suggestedWeeklyVolume,
  strengthRatePerWeek,
  type ProgressPoint,
} from "@/lib/progress";
import LiftChart, { type ChartPoint } from "@/components/LiftChart";
import CoachPanel from "@/components/CoachPanel";
import LiftList, { type LiftRow } from "@/components/LiftList";
import LogLiftForm from "@/components/LogLiftForm";
import ExerciseStats from "@/components/ExerciseStats";
import VolumeChart, { type VolumePoint } from "@/components/VolumeChart";
import VolumeGoalCard from "@/components/VolumeGoalCard";

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

  const [lifts, goal, volumeGoal] = await Promise.all([
    prisma.liftEntry.findMany({
      where: { userId, exercise },
      orderBy: { performedAt: "asc" },
    }),
    prisma.goal.findFirst({ where: { userId, exercise } }),
    prisma.volumeGoal.findUnique({
      where: { userId_exercise: { userId, exercise } },
    }),
  ]);

  const unit = goal?.unit ?? lifts[0]?.unit ?? "lb";
  const goal1RM = goal
    ? estimateOneRepMax(goal.targetWeight, goal.targetReps)
    : null;

  // Analytics points (used by the chart projection and the stats below).
  const points: ProgressPoint[] = lifts.map((l) => ({
    weight: l.weight,
    reps: l.reps,
    sets: l.sets,
    performedAt: l.performedAt,
  }));

  // Best estimated 1RM per day + a 3-point moving average.
  const byDay = new Map<string, number>();
  for (const l of lifts) {
    const day = l.performedAt.toISOString().slice(0, 10);
    const orm = estimateOneRepMax(l.weight, l.reps);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, orm));
  }
  const series = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const fmtDay = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  const chartData: ChartPoint[] = series.map(([day, orm], i) => {
    const win = series.slice(Math.max(0, i - 2), i + 1).map((s) => s[1]);
    return {
      date: day,
      label: fmtDay(day),
      oneRM: Math.round(orm),
      ma: Math.round(win.reduce((a, b) => a + b, 0) / win.length),
    };
  });

  // Projected future strength: extend the recent progression rate 8 weeks out.
  const rate = strengthRatePerWeek(points);
  if (rate && rate > 0 && series.length >= 2) {
    const last = series[series.length - 1];
    const lastDate = new Date(`${last[0]}T12:00:00`);
    chartData[chartData.length - 1].projected = Math.round(last[1]);
    for (let w = 1; w <= 8; w++) {
      const day = new Date(lastDate.getTime() + w * 7 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      chartData.push({
        date: day,
        label: fmtDay(day),
        projected: Math.round(last[1] + rate * w),
      });
    }
  }

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

  // Progress analytics (PRs, rep maxes, volume).
  const prs = prHistory(points).map((pr) => ({
    performedAt: pr.performedAt.toISOString(),
    weight: pr.weight,
    reps: pr.reps,
    oneRM: pr.oneRM,
  }));
  const maxes = repMaxes(points).map((r) => ({
    reps: r.reps,
    weight: r.weight,
    performedAt: r.performedAt.toISOString(),
  }));
  const vol = volumeStats(points);
  const volumeSummary = {
    totalVolume: vol.totalVolume,
    sessions: vol.sessions,
    bestSessionVolume: vol.bestSession?.volume ?? null,
    lastSessionVolume: vol.lastSession?.volume ?? null,
  };

  // Volume per day for the bar chart.
  const volByDay = new Map<string, number>();
  for (const l of lifts) {
    const day = l.performedAt.toISOString().slice(0, 10);
    volByDay.set(day, (volByDay.get(day) ?? 0) + volumeOf(l));
  }
  const volumeChartData: VolumePoint[] = [...volByDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, volume]) => ({
      date: day,
      volume,
      label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  const weekVolume = currentWeekVolume(points);
  const suggestedVolume = suggestedWeeklyVolume(points);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-fg-muted hover:text-fg">
          ← Dashboard
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Estimated 1-rep max over time
        </h2>
        <LiftChart data={chartData} unit={unit} goal={goal1RM} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            Training volume over time
          </h2>
          <VolumeChart data={volumeChartData} unit={unit} />
        </div>
        <VolumeGoalCard
          exercise={exercise}
          unit={unit}
          weekVolume={weekVolume}
          target={volumeGoal?.weeklyVolume ?? null}
          suggested={suggestedVolume}
        />
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

      <ExerciseStats
        unit={unit}
        prs={prs}
        repMaxes={maxes}
        volume={volumeSummary}
      />

      <div className="card">
        <h2 className="mb-2 font-semibold">History</h2>
        <LiftList lifts={rows} showExercise={false} />
      </div>
    </div>
  );
}
