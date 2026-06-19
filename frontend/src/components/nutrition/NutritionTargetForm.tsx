"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ExistingTarget {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
}

export default function NutritionTargetForm({
  existing,
}: {
  existing: ExistingTarget | null;
}) {
  const router = useRouter();
  const [calories, setCalories] = useState(String(existing?.calories ?? ""));
  const [proteinG, setProteinG] = useState(String(existing?.proteinG ?? ""));
  const [carbsG, setCarbsG] = useState(String(existing?.carbsG ?? ""));
  const [fatG, setFatG] = useState(String(existing?.fatG ?? ""));
  const [fiberG, setFiberG] = useState(String(existing?.fiberG ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/nutrition/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories: Number(calories),
          proteinG: Number(proteinG),
          carbsG: Number(carbsG),
          fatG: Number(fatG),
          fiberG: fiberG ? Number(fiberG) : undefined,
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

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
  ) => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min="0"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        required={label !== "Fiber (g)"}
      />
    </div>
  );

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="font-semibold">Daily targets</h2>
      <div className="grid grid-cols-2 gap-3">
        {field("Calories", calories, setCalories, "2200")}
        {field("Protein (g)", proteinG, setProteinG, "160")}
        {field("Carbs (g)", carbsG, setCarbsG, "220")}
        {field("Fat (g)", fatG, setFatG, "70")}
        {field("Fiber (g)", fiberG, setFiberG, "30")}
      </div>
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : existing ? "Update targets" : "Set targets"}
      </button>
    </form>
  );
}
