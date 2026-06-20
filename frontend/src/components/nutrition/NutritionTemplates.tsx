"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TemplateSummary {
  id: string;
  name: string;
  itemCount: number;
  calories: number;
}

export default function NutritionTemplates({
  templates,
  canSave,
}: {
  templates: TemplateSummary[];
  canSave: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveToday(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/nutrition/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function apply(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/nutrition/templates/${id}/apply`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/nutrition/templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Meal templates</h2>

      <form onSubmit={saveToday} className="flex gap-2">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name today's log (e.g. Cutting day)"
          required
        />
        <button
          type="submit"
          className="btn-ghost whitespace-nowrap"
          disabled={saving || !canSave}
          title={canSave ? "" : "Log some food today first"}
        >
          {saving ? "Saving…" : "Save today"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-fg-subtle">
          No templates yet. Save a day&apos;s log to re-use it in one tap.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-fg-subtle">
                  {t.itemCount} item{t.itemCount === 1 ? "" : "s"} ·{" "}
                  {Math.round(t.calories)} kcal
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => apply(t.id)}
                  disabled={busyId === t.id}
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  {busyId === t.id ? "…" : "Log"}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  disabled={busyId === t.id}
                  className="rounded-lg px-2 py-1 text-xs text-fg-subtle hover:bg-surface-2 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
