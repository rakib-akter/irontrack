"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FOODS } from "@/lib/nutrition";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

interface ParsedItem {
  foodKey: string;
  name: string;
  grams: number;
  nutrients: { calories: number };
}

export default function NutritionLogger() {
  const router = useRouter();
  const [mealType, setMealType] = useState<Meal>("breakfast");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI parse
  const [mealText, setMealText] = useState("");
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  // Quick add
  const [foodKey, setFoodKey] = useState(FOODS[0].key);
  const [grams, setGrams] = useState("");

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType, ...body }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "Could not save");
    }
  }

  async function parse() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/nutrition/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: mealText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not parse");
        return;
      }
      setParsed(data.items);
      setUnmatched(data.unmatched ?? []);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function addParsed() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      for (const it of parsed) {
        await post({ foodKey: it.foodKey, grams: it.grams, source: "ai" });
      }
      setParsed(null);
      setMealText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post({
        foodKey,
        grams: grams ? Number(grams) : undefined,
      });
      setGrams("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Log food</h2>
        <select
          className="input w-auto"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as Meal)}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {/* AI meal parsing */}
      <div className="space-y-2">
        <label className="label">✦ Describe a meal (AI parse)</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            placeholder="2 eggs + rice + 150g chicken"
          />
          <button
            type="button"
            onClick={parse}
            disabled={busy || !mealText.trim()}
            className="btn-ghost whitespace-nowrap"
          >
            Parse
          </button>
        </div>
        {parsed && (
          <div className="rounded-xl border border-border bg-surface p-3">
            {parsed.length === 0 ? (
              <p className="text-sm text-fg-muted">No known foods recognized.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {parsed.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {it.name}{" "}
                      <span className="text-fg-subtle">· {it.grams} g</span>
                    </span>
                    <span className="text-fg-muted">
                      {Math.round(it.nutrients.calories)} kcal
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {unmatched.length > 0 && (
              <p className="mt-2 text-xs text-warning">
                Couldn&apos;t match: {unmatched.join(", ")}
              </p>
            )}
            {parsed.length > 0 && (
              <button
                type="button"
                onClick={addParsed}
                disabled={busy}
                className="btn-primary mt-3 w-full"
              >
                {busy ? "Adding…" : `Add ${parsed.length} item(s)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick add from food DB */}
      <form onSubmit={quickAdd} className="space-y-2">
        <label className="label">Quick add</label>
        <div className="flex gap-2">
          <select
            className="input"
            value={foodKey}
            onChange={(e) => setFoodKey(e.target.value)}
          >
            {FOODS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name}
              </option>
            ))}
          </select>
          <input
            className="input w-28"
            type="number"
            min="1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="grams"
          />
          <button type="submit" disabled={busy} className="btn-primary">
            Add
          </button>
        </div>
        <p className="text-xs text-fg-subtle">
          Leave grams blank to use a typical serving.
        </p>
      </form>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
