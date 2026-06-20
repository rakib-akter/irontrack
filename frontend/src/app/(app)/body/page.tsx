import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  trendWeight,
  leanMass,
  fatMass,
  compositionChange,
  type CompositionPoint,
} from "@/lib/bodycomp";
import PeriodSelector from "@/components/body/PeriodSelector";
import CompositionCharts, {
  type WeightPoint,
  type BfPoint,
  type MassPoint,
} from "@/components/body/CompositionCharts";
import MeasurementForm from "@/components/body/MeasurementForm";
import MeasurementList, {
  type MeasurementRow,
} from "@/components/body/MeasurementList";
import ProgressPhotos from "@/components/body/ProgressPhotos";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default async function BodyPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { period: periodParam } = await searchParams;
  const period = ["month", "quarter", "year"].includes(periodParam ?? "")
    ? (periodParam as string)
    : "quarter";
  const periodDays = period === "month" ? 30 : period === "year" ? 365 : 90;
  const cutoff = new Date(Date.now() - periodDays * DAY_MS);

  const [measurements, bodyWeights, profile] = await Promise.all([
    prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
    prisma.bodyWeightEntry.findMany({
      where: { userId },
      orderBy: { performedAt: "asc" },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  const unit = profile?.units ?? "lb";

  // Unified weight-by-day (measurements take precedence over plain weigh-ins).
  const weightByDay = new Map<string, number>();
  for (const b of bodyWeights)
    weightByDay.set(b.performedAt.toISOString().slice(0, 10), b.weight);
  for (const m of measurements)
    if (m.weight !== null)
      weightByDay.set(m.performedAt.toISOString().slice(0, 10), m.weight);

  const cutoffDay = cutoff.toISOString().slice(0, 10);
  const days = [...weightByDay.keys()].filter((d) => d >= cutoffDay).sort();
  const weights = days.map((d) => weightByDay.get(d)!);
  const trend = trendWeight(weights, 0.12);
  const weightData: WeightPoint[] = days.map((d, i) => ({
    label: fmt(d),
    weight: weights[i],
    trend: trend[i],
  }));

  // Body fat + mass from measurements in the period.
  const inPeriod = measurements.filter((m) => m.performedAt >= cutoff);
  const bfData: BfPoint[] = inPeriod.map((m) => ({
    label: fmt(m.performedAt.toISOString().slice(0, 10)),
    bodyFat: m.bodyFatPct,
  }));
  const massData: MassPoint[] = inPeriod.map((m) => ({
    label: fmt(m.performedAt.toISOString().slice(0, 10)),
    lean: m.weight && m.bodyFatPct ? leanMass(m.weight, m.bodyFatPct) : null,
    fat: m.weight && m.bodyFatPct ? fatMass(m.weight, m.bodyFatPct) : null,
  }));

  // Current snapshot.
  const currentWeight = weights.length ? weights[weights.length - 1] : null;
  const withBf = inPeriod.filter((m) => m.bodyFatPct !== null && m.weight);
  const latestBf = withBf.length ? withBf[withBf.length - 1] : null;
  const curBfPct = latestBf?.bodyFatPct ?? null;
  const curWeightForBf = latestBf?.weight ?? currentWeight;

  // Composition change over the period (for the AI insight).
  let change: ReturnType<typeof compositionChange> | null = null;
  if (withBf.length >= 2) {
    const start: CompositionPoint = {
      weight: withBf[0].weight!,
      bodyFatPct: withBf[0].bodyFatPct,
    };
    const end: CompositionPoint = {
      weight: withBf[withBf.length - 1].weight!,
      bodyFatPct: withBf[withBf.length - 1].bodyFatPct,
    };
    change = compositionChange(start, end);
  } else if (weights.length >= 2) {
    change = compositionChange(
      { weight: weights[0], bodyFatPct: null },
      { weight: weights[weights.length - 1], bodyFatPct: null },
    );
  }

  const rows: MeasurementRow[] = [...measurements].reverse().map((m) => ({
    id: m.id,
    weight: m.weight,
    unit: m.unit,
    waistCm: m.waistCm,
    neckCm: m.neckCm,
    bodyFatPct: m.bodyFatPct,
    performedAt: m.performedAt.toISOString(),
  }));

  const stat = (label: string, value: string, accent = false) => (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Body composition</h1>
        <PeriodSelector current={period} />
      </div>

      {/* Snapshot */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stat("Weight", currentWeight !== null ? `${currentWeight} ${unit}` : "—", true)}
        {stat("Body fat", curBfPct !== null ? `${curBfPct}%` : "—")}
        {stat(
          "Lean mass",
          curBfPct !== null && curWeightForBf
            ? `${leanMass(curWeightForBf, curBfPct)} ${unit}`
            : "—",
        )}
        {stat(
          "Fat mass",
          curBfPct !== null && curWeightForBf
            ? `${fatMass(curWeightForBf, curBfPct)} ${unit}`
            : "—",
        )}
      </div>

      {/* AI insight */}
      {change && (
        <div className="card">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent-weak text-xs">
              ✦
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
              This {period}
            </h2>
          </div>
          <p className="mt-3 text-sm text-fg">{change.summary}</p>
        </div>
      )}

      <CompositionCharts
        weight={weightData}
        bodyFat={bfData}
        mass={massData}
        unit={unit}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <MeasurementForm unit={unit} />
        <div className="card">
          <h2 className="mb-2 font-semibold">History</h2>
          <MeasurementList rows={rows} />
        </div>
      </div>

      <ProgressPhotos />
    </div>
  );
}
