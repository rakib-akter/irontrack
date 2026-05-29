import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BodyWeightChart, {
  type BodyWeightPoint,
} from "@/components/BodyWeightChart";
import BodyWeightForm from "@/components/BodyWeightForm";
import BodyWeightList, {
  type BodyWeightRow,
} from "@/components/BodyWeightList";

export const dynamic = "force-dynamic";

export default async function BodyWeightPage() {
  const userId = (await getUserId())!;

  const entries = await prisma.bodyWeightEntry.findMany({
    where: { userId },
    orderBy: { performedAt: "asc" },
  });

  const unit = entries[entries.length - 1]?.unit ?? "lb";

  // One point per day (latest measurement that day) for the chart.
  const byDay = new Map<string, number>();
  for (const e of entries) {
    byDay.set(e.performedAt.toISOString().slice(0, 10), e.weight);
  }
  const chartData: BodyWeightPoint[] = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, weight]) => ({
      date: day,
      weight,
      label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  // Summary stats.
  const current = entries.length ? entries[entries.length - 1].weight : null;
  const first = entries.length ? entries[0].weight : null;
  const change = current !== null && first !== null ? current - first : null;

  const rows: BodyWeightRow[] = [...entries].reverse().map((e) => ({
    id: e.id,
    weight: e.weight,
    unit: e.unit,
    notes: e.notes,
    performedAt: e.performedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Body weight</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Current</p>
          <p className="mt-1 text-3xl font-bold text-blue-400">
            {current !== null ? `${current} ${unit}` : "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Change since start
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              change === null
                ? "text-zinc-500"
                : change > 0
                  ? "text-emerald-400"
                  : change < 0
                    ? "text-amber-400"
                    : "text-zinc-200"
            }`}
          >
            {change === null
              ? "—"
              : `${change > 0 ? "+" : ""}${Math.round(change * 10) / 10} ${unit}`}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Measurements
          </p>
          <p className="mt-1 text-3xl font-bold">{entries.length}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
          Weight over time
        </h2>
        <BodyWeightChart data={chartData} unit={unit} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BodyWeightForm />
        <div className="card">
          <h2 className="mb-2 font-semibold">History</h2>
          <BodyWeightList entries={rows} />
        </div>
      </div>
    </div>
  );
}
