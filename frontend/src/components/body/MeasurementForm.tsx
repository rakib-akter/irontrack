"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MeasurementForm({ unit }: { unit: string }) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weight ? Number(weight) : undefined,
          unit,
          waistCm: waist ? Number(waist) : undefined,
          neckCm: neck ? Number(neck) : undefined,
          hipCm: hip ? Number(hip) : undefined,
          performedAt: new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setWeight("");
      setWaist("");
      setNeck("");
      setHip("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold">Log a measurement</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Weight ({unit})</label>
          <input className="input" type="number" step="any" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="180" />
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Waist (cm)</label>
          <input className="input" type="number" step="any" min="0" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="85" />
        </div>
        <div>
          <label className="label">Neck (cm)</label>
          <input className="input" type="number" step="any" min="0" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="38" />
        </div>
        <div>
          <label className="label">Hip (cm)</label>
          <input className="input" type="number" step="any" min="0" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="—" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : "Save measurement"}
      </button>
      <p className="text-xs text-fg-subtle">
        Add waist &amp; neck (and hip for women) with your height + sex in your
        profile to auto-estimate body fat. Hip is only needed for the female
        formula.
      </p>
    </form>
  );
}
