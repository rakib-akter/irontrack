"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BodyWeightForm() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bodyweight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: Number(weight),
          unit,
          notes: notes || undefined,
          performedAt: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setWeight("");
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
      <h2 className="font-semibold">Log your weight</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Weight</label>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="180"
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
        <label className="label">Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Morning, after waking up"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Log weight"}
      </button>
    </form>
  );
}
