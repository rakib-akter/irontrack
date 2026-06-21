import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  recoveryScore,
  readiness,
  recoveryWarnings,
  deloadSuggestion,
} from "@/lib/recovery";
import Ring from "@/components/ui/Ring";
import RecoveryForm, { type TodayRecovery } from "@/components/recovery/RecoveryForm";
import RecoveryChart, { type RecoveryPoint } from "@/components/recovery/RecoveryChart";
import RecoveryList, { type RecoveryRow } from "@/components/recovery/RecoveryList";

export const dynamic = "force-dynamic";

const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default async function RecoveryPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const logs = await prisma.recoveryLog.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const scored = logs.map((l) => ({ log: l, score: recoveryScore(l) }));
  const trend: RecoveryPoint[] = scored
    .filter((s) => s.score !== null)
    .map((s) => ({ label: fmt(s.log.date), score: s.score! }));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLog =
    logs.find((l) => l.date.toISOString().slice(0, 10) === todayKey) ?? null;
  const todayScore = todayLog ? recoveryScore(todayLog) : null;
  const read = readiness(todayScore);
  const warnings = todayLog ? recoveryWarnings(todayLog) : [];
  const deload = deloadSuggestion(
    scored.map((s) => s.score).filter((s): s is number => s !== null),
  );
  const allWarnings = deload ? [deload, ...warnings] : warnings;

  const todayForm: TodayRecovery | null = todayLog
    ? {
        sleepHours: todayLog.sleepHours,
        sleepQuality: todayLog.sleepQuality,
        stress: todayLog.stress,
        energy: todayLog.energy,
        soreness: todayLog.soreness,
        steps: todayLog.steps,
        restingHr: todayLog.restingHr,
      }
    : null;

  const rows: RecoveryRow[] = [...scored].reverse().map((s) => ({
    id: s.log.id,
    date: s.log.date.toISOString(),
    score: s.score,
    sleepHours: s.log.sleepHours,
    soreness: s.log.soreness,
  }));

  const ringColor =
    read.level === "ready"
      ? "var(--positive)"
      : read.level === "rest"
        ? "var(--danger)"
        : "var(--warning)";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Recovery &amp; readiness</h1>

      {/* Today's score + readiness */}
      <div className="card">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
          <Ring value={todayScore ?? 0} max={100} size={150} stroke={12} color={ringColor}>
            <div>
              <p className="text-3xl font-bold">{todayScore ?? "—"}</p>
              <p className="text-[11px] text-fg-subtle">recovery</p>
            </div>
          </Ring>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-wide text-fg-muted">
              Training readiness
            </p>
            <p
              className="mt-1 text-2xl font-bold"
              style={{ color: ringColor }}
            >
              {read.label}
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              {todayLog
                ? "Based on today's sleep, stress, energy, and soreness."
                : "Log today's check-in to get your score and readiness."}
            </p>
          </div>
        </div>

        {allWarnings.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-border pt-4">
            {allWarnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    w.tone === "warning" ? "bg-warning" : "bg-accent"
                  }`}
                />
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trend */}
      <div className="card">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Recovery trend
        </h2>
        <RecoveryChart data={trend} />
      </div>

      {/* Form + history */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecoveryForm today={todayForm} />
        <div className="card">
          <h2 className="mb-2 font-semibold">History</h2>
          <RecoveryList rows={rows} />
        </div>
      </div>
    </div>
  );
}
