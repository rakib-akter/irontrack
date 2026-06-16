"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMON_EXERCISES } from "@/lib/exercises";

export default function GoalForm({
  defaultExercise,
}: {
  defaultExercise?: string;
}) {
  const router = useRouter();
  const [exercise, setExercise] = useState(defaultExercise ?? "");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetReps, setTargetReps] = useState("1");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise,
          targetWeight: Number(targetWeight),
          targetReps: Number(targetReps),
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
      setTargetWeight("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold">Set a goal</h2>
      <div>
        <label className="label">Exercise</label>
        <input
          className="input"
          list="goal-exercise-options"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          placeholder="Bench Press"
          required
        />
        <datalist id="goal-exercise-options">
          {COMMON_EXERCISES.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Target weight</label>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="315"
            required
          />
        </div>
        <div>
          <label className="label">For reps</label>
          <input
            className="input"
            type="number"
            min="1"
            value={targetReps}
            onChange={(e) => setTargetReps(e.target.value)}
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

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Save goal"}
      </button>
      <p className="text-xs text-zinc-500">
        Targeting more than 1 rep (e.g. 225 × 5) sets a goal based on the
        equivalent 1-rep max.
      </p>
    </form>
  );
}
