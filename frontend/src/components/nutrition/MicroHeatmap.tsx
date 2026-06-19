import { MICROS, type NutrientTotals } from "@/lib/nutrition";

function tier(pct: number, limit: boolean) {
  if (limit) {
    // For "stay under" nutrients (sodium): under budget is good.
    if (pct > 100) return { bar: "bg-danger", text: "text-danger" };
    return { bar: "bg-positive", text: "text-fg" };
  }
  if (pct >= 100) return { bar: "bg-positive", text: "text-positive" };
  if (pct >= 66) return { bar: "bg-accent", text: "text-fg" };
  if (pct >= 33) return { bar: "bg-warning", text: "text-fg" };
  return { bar: "bg-danger", text: "text-fg-muted" };
}

export default function MicroHeatmap({
  totals,
  percents,
}: {
  totals: NutrientTotals;
  percents: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MICROS.map((m) => {
        const pct = percents[m.key] ?? 0;
        const t = tier(pct, !!m.limit);
        const amount = totals[m.key] || 0;
        return (
          <div key={m.key} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-fg">{m.label}</span>
              <span className={`text-xs ${t.text}`}>{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full ${t.bar}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-fg-subtle">
              {Math.round(amount * 10) / 10} / {m.dv} {m.unit}
              {m.limit ? " (limit)" : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
