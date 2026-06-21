import type { IntelligenceReport } from "@/lib/reports";

const SECTIONS: {
  key: keyof Pick<
    IntelligenceReport,
    "wins" | "misses" | "predictions" | "nextActions"
  >;
  title: string;
  icon: string;
  dot: string;
}[] = [
  { key: "wins", title: "Wins", icon: "🏆", dot: "bg-positive" },
  { key: "misses", title: "Misses", icon: "⚠️", dot: "bg-warning" },
  { key: "predictions", title: "Predictions", icon: "🔮", dot: "bg-accent" },
  { key: "nextActions", title: "Next actions", icon: "🎯", dot: "bg-accent" },
];

export default function ReportView({ report }: { report: IntelligenceReport }) {
  const range = `${new Date(report.periodStartISO).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(report.periodEndISO).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">{range}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const items = report[s.key];
          return (
            <div key={s.key} className="card">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                <span>{s.icon}</span> {s.title}
              </h2>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-fg-subtle">Nothing to report.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {items.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
