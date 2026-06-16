"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMON_EXERCISES } from "@/lib/exercises";

export default function LogLiftForm({
  defaultExercise,
}: {
  defaultExercise?: string;
}) {
  const router = useRouter();
  const [exercise, setExercise] = useState(defaultExercise ?? "");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("1");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise,
          weight: Number(weight),
          reps: Number(reps),
          sets: Number(sets),
          unit,
          notes: notes || undefined,
          // store at noon local to avoid timezone date-shift surprises
          performedAt: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      // Reset the numeric fields, keep exercise/unit for fast repeated logging.
      setWeight("");
      setReps("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label">Exercise</label>
        <input
          className="input"
          list="exercise-options"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          placeholder="Bench Press"
          required
        />
        <datalist id="exercise-options">
          {COMMON_EXERCISES.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Weight</label>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="225"
            required
          />
        </div>
        <div>
          <label className="label">Reps</label>
          <input
            className="input"
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="5"
            required
          />
        </div>
        <div>
          <label className="label">Sets</label>
          <input
            className="input"
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Felt strong, last rep was a grind"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Log lift"}
      </button>
    </form>
  );
}
