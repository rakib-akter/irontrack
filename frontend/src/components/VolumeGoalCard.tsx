"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function VolumeGoalCard({
  exercise,
  unit,
  weekVolume,
  target,
  suggested,
}: {
  exercise: string; // normalized key
  unit: string;
  weekVolume: number; // volume logged so far this week
  target: number | null; // existing weekly goal
  suggested: number | null; // rule-based suggestion (AI later)
}) {
  const router = useRouter();
  const [value, setValue] = useState(target ? String(target) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pct =
    target && target > 0
      ? Math.min(100, Math.round((weekVolume / target) * 100))
      : null;
  const reached = target !== null && weekVolume >= target;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/volume-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise,
          weeklyVolume: Number(value),
          unit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function clearGoal() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/volume-goals?exercise=${encodeURIComponent(exercise)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setValue("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Weekly volume goal
        </h2>
        {target !== null && (
          <span className="text-xs text-fg-subtle">
            {reached ? "✅ reached" : `${pct}%`}
          </span>
        )}
      </div>

      {target !== null ? (
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className={reached ? "text-accent" : "text-fg"}>
              {fmt(weekVolume)} {unit}
            </span>
            <span className="text-fg-subtle">
              of {fmt(target)} {unit} this week
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${reached ? "bg-accent" : "bg-accent"}`}
              style={{ width: `${pct ?? 0}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">
          Set a weekly volume target to track how much work you put in each week
          (you&apos;ve done {fmt(weekVolume)} {unit} so far this week).
        </p>
      )}

      <form onSubmit={save} className="space-y-2">
        <label className="label">
          Target volume per week ({unit})
        </label>
        <div className="flex gap-2">
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={suggested ? String(suggested) : "e.g. 15000"}
            required
          />
          {suggested !== null && (
            <button
              type="button"
              onClick={() => setValue(String(suggested))}
              className="btn-ghost whitespace-nowrap"
              title="Suggested from your recent weekly average (AI-powered later)"
            >
              Suggest {fmt(suggested)}
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? "Saving…" : target !== null ? "Update goal" : "Set goal"}
          </button>
          {target !== null && (
            <button
              type="button"
              onClick={clearGoal}
              className="btn-ghost"
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
