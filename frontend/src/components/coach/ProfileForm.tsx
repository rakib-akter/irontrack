"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ExistingProfile {
  primaryGoal: string | null;
  trainingLevel: string | null;
  daysPerWeek: number | null;
  units: string;
}

const GOALS = [
  { value: "strength", label: "Get stronger" },
  { value: "hypertrophy", label: "Build muscle" },
  { value: "fat_loss", label: "Lose fat" },
  { value: "recomposition", label: "Recomposition" },
  { value: "general_health", label: "General health" },
];

export default function ProfileForm({
  existing,
}: {
  existing: ExistingProfile | null;
}) {
  const router = useRouter();
  const [primaryGoal, setGoal] = useState(existing?.primaryGoal ?? "strength");
  const [trainingLevel, setLevel] = useState(
    existing?.trainingLevel ?? "intermediate",
  );
  const [daysPerWeek, setDays] = useState(String(existing?.daysPerWeek ?? 4));
  const [units, setUnits] = useState(existing?.units ?? "lb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryGoal,
          trainingLevel,
          daysPerWeek: Number(daysPerWeek),
          units,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not save");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="font-semibold">Your coaching profile</h2>
      <div>
        <label className="label">Primary goal</label>
        <select className="input" value={primaryGoal} onChange={(e) => setGoal(e.target.value)}>
          {GOALS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Experience</label>
          <select className="input" value={trainingLevel} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="label">Days / week</label>
          <input
            className="input"
            type="number"
            min="1"
            max="7"
            value={daysPerWeek}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Units</label>
          <select className="input" value={units} onChange={(e) => setUnits(e.target.value)}>
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : existing ? "Update profile" : "Save & build my plan"}
      </button>
    </form>
  );
}
