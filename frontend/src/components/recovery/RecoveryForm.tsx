"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TodayRecovery {
  sleepHours: number | null;
  sleepQuality: number | null;
  stress: number | null;
  energy: number | null;
  soreness: number | null;
  steps: number | null;
  restingHr: number | null;
}

function Segmented({
  label,
  value,
  onChange,
  lowHint,
  highHint,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  lowHint: string;
  highHint: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 flex-1 rounded-lg border text-sm transition-colors ${
              value === n
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface text-fg-muted hover:bg-surface-2"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-fg-subtle">
        <span>{lowHint}</span>
        <span>{highHint}</span>
      </div>
    </div>
  );
}

export default function RecoveryForm({
  today,
}: {
  today: TodayRecovery | null;
}) {
  const router = useRouter();
  const [sleepHours, setSleepHours] = useState(
    today?.sleepHours != null ? String(today.sleepHours) : "",
  );
  const [steps, setSteps] = useState(today?.steps != null ? String(today.steps) : "");
  const [restingHr, setRestingHr] = useState(
    today?.restingHr != null ? String(today.restingHr) : "",
  );
  const [sleepQuality, setSleepQuality] = useState<number | null>(today?.sleepQuality ?? null);
  const [stress, setStress] = useState<number | null>(today?.stress ?? null);
  const [energy, setEnergy] = useState<number | null>(today?.energy ?? null);
  const [soreness, setSoreness] = useState<number | null>(today?.soreness ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          sleepHours: sleepHours ? Number(sleepHours) : undefined,
          sleepQuality: sleepQuality ?? undefined,
          stress: stress ?? undefined,
          energy: energy ?? undefined,
          soreness: soreness ?? undefined,
          steps: steps ? Number(steps) : undefined,
          restingHr: restingHr ? Number(restingHr) : undefined,
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

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold">Today&apos;s check-in</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Sleep (h)</label>
          <input className="input" type="number" step="0.5" min="0" max="24" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="8" />
        </div>
        <div>
          <label className="label">Steps</label>
          <input className="input" type="number" min="0" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" />
        </div>
        <div>
          <label className="label">Resting HR</label>
          <input className="input" type="number" min="0" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} placeholder="58" />
        </div>
      </div>

      <Segmented label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} lowHint="poor" highHint="great" />
      <Segmented label="Stress" value={stress} onChange={setStress} lowHint="calm" highHint="frazzled" />
      <Segmented label="Energy" value={energy} onChange={setEnergy} lowHint="drained" highHint="buzzing" />
      <Segmented label="Soreness (DOMS)" value={soreness} onChange={setSoreness} lowHint="fresh" highHint="wrecked" />

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving…" : today ? "Update check-in" : "Save check-in"}
      </button>
    </form>
  );
}
