import type { Insight } from "@/lib/insights";

const TONE: Record<Insight["tone"], { dot: string; label: string }> = {
  positive: { dot: "bg-positive", label: "Win" },
  warning: { dot: "bg-warning", label: "Watch" },
  info: { dot: "bg-accent", label: "Note" },
};

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-accent-weak text-xs">
          ✦
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          AI insights
        </h2>
      </div>

      {insights.length === 0 ? (
        <p className="mt-3 text-sm text-fg-subtle">
          Log a couple of weeks of training and insights about your volume,
          plateaus, and PR pace will appear here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[ins.tone].dot}`}
              />
              <span className="text-fg">{ins.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
