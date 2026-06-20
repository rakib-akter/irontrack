import type { WeeklyPlan } from "@/lib/coach/planner";

function confidenceLabel(c: number) {
  if (c >= 0.75) return "High";
  if (c >= 0.55) return "Medium";
  return "Low";
}

export default function CoachPlan({ plan }: { plan: WeeklyPlan }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Your weekly plan
          </p>
          <span className="rounded-full bg-accent-weak px-2.5 py-1 text-xs text-accent">
            {confidenceLabel(plan.confidence)} confidence ·{" "}
            {Math.round(plan.confidence * 100)}%
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold">{plan.focus}</p>
      </div>

      {/* Prescription */}
      {plan.prescription.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            This week&apos;s prescription
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-fg-subtle">
                  <th className="pb-2 font-medium">Lift</th>
                  <th className="pb-2 font-medium">Sets</th>
                  <th className="pb-2 font-medium">Reps</th>
                  <th className="pb-2 font-medium">Intensity</th>
                  <th className="pb-2 font-medium">Rest</th>
                  <th className="pb-2 font-medium">Progression</th>
                </tr>
              </thead>
              <tbody>
                {plan.prescription.map((p) => (
                  <tr key={p.exercise} className="border-t border-border align-top">
                    <td className="py-2 font-medium text-fg">{p.exercise}</td>
                    <td className="py-2">{p.sets}</td>
                    <td className="py-2">{p.reps}</td>
                    <td className="py-2">{p.intensity}</td>
                    <td className="py-2">{p.rest}</td>
                    <td className="py-2 text-fg-muted">{p.progression}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations with reasoning + citations */}
      <div className="space-y-4">
        {plan.recommendations.map((rec, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{rec.title}</h3>
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
                {confidenceLabel(rec.confidence)}
              </span>
            </div>
            <p className="mt-1 text-sm text-fg">{rec.detail}</p>
            <p className="mt-2 text-sm text-fg-muted">
              <span className="font-medium text-fg-muted">Why: </span>
              {rec.reasoning}
            </p>
            {rec.citations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {rec.citations.map((c) => (
                  <span
                    key={c.slug}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg-muted"
                    title={c.title}
                  >
                    📄 {c.authors}
                    {c.year ? ` (${c.year})` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-fg-subtle">
        Every recommendation cites the research it&apos;s based on — the coach
        can only cite findings retrieved from STRATUM&apos;s research library.
      </p>
    </div>
  );
}
