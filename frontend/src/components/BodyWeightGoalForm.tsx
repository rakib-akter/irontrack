"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ExistingBodyWeightGoal {
  targetWeight: number;
  unit: string;
  targetDate: string | null;
}

export default function BodyWeightGoalForm({
  existing,
}: {
  existing: ExistingBodyWeightGoal | null;
}) {
  const router = useRouter();
  const [targetWeight, setTargetWeight] = useState(
    existing ? String(existing.targetWeight) : "",
  );
  const [unit, setUnit] = useState<"lb" | "kg">(
    (existing?.unit as "lb" | "kg") ?? "lb",
  );
  const [targetDate, setTargetDate] = useState(
    existing?.targetDate ? existing.targetDate.slice(0, 10) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bodyweight/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetWeight: Number(targetWeight),
          unit,
          targetDate: targetDate
            ? new Date(`${targetDate}T12:00:00`).toISOString()
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save goal");
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
      const res = await fetch("/api/bodyweight/goal", { method: "DELETE" });
      if (res.ok) {
        setTargetWeight("");
        setTargetDate("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="font-semibold">Goal weight</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target</label>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="175"
            required
          />
        </div>
        <div>
          <label className="label">Unit</label>
          <select
            className="input"
            value={unit}
            onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Target date (optional)</label>
        <input
          className="input"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? "Saving…" : existing ? "Update goal" : "Set goal"}
        </button>
        {existing && (
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
  );
}
