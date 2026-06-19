import type { NutritionAdvice } from "@/lib/nutrition/advice";

export default function NutritionAdvicePanel({
  advice,
}: {
  advice: NutritionAdvice;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-accent-weak text-xs">
            ✦
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            Nutrition coach
          </h2>
        </div>
        <span className="text-xs text-fg-subtle">
          confidence {Math.round(advice.confidence * 100)}%
        </span>
      </div>

      {advice.items.length === 0 ? (
        <p className="mt-3 text-sm text-fg-subtle">
          Log today&apos;s meals and you&apos;ll get specific guidance on what
          you&apos;re missing and what to eat.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {advice.items.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  a.tone === "warning" ? "bg-warning" : "bg-accent"
                }`}
              />
              <span className="text-fg">{a.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
