"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const GOALS = [
  { value: "strength", label: "Get stronger" },
  { value: "hypertrophy", label: "Build muscle" },
  { value: "fat_loss", label: "Lose fat" },
  { value: "recomposition", label: "Recomposition" },
  { value: "general_health", label: "General health" },
];

export default function OnboardingForm() {
  const router = useRouter();
  const [primaryGoal, setGoal] = useState("strength");
  const [trainingLevel, setLevel] = useState("intermediate");
  const [daysPerWeek, setDays] = useState("4");
  const [units, setUnits] = useState("lb");
  const [sex, setSex] = useState("");
  const [heightCm, setHeight] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProtein] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(e: React.FormEvent) {
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
          sex: sex || undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not save");
        return;
      }
      // Optional starting nutrition targets.
      if (calories && proteinG) {
        const cal = Number(calories);
        const p = Number(proteinG);
        const fatG = Math.round((cal * 0.25) / 9);
        const carbsG = Math.max(0, Math.round((cal - p * 4 - fatG * 9) / 4));
        await fetch("/api/nutrition/target", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calories: cal, proteinG: p, carbsG, fatG, fiberG: 30 }),
        });
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={finish}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card space-y-5"
    >
      <div>
        <label className="label">What&apos;s your main goal?</label>
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
          <input className="input" type="number" min="1" max="7" value={daysPerWeek} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div>
          <label className="label">Units</label>
          <select className="input" value={units} onChange={(e) => setUnits(e.target.value)}>
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Sex (optional)</label>
          <select className="input" value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Height cm (optional)</label>
          <input className="input" type="number" value={heightCm} onChange={(e) => setHeight(e.target.value)} placeholder="178" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Daily calories (optional)</label>
          <input className="input" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2200" />
        </div>
        <div>
          <label className="label">Daily protein g (optional)</label>
          <input className="input" type="number" value={proteinG} onChange={(e) => setProtein(e.target.value)} placeholder="160" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
        {loading ? "Setting up…" : "Enter STRATUM"}
      </button>
    </motion.form>
  );
}
