"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface NutritionRow {
  id: string;
  name: string;
  grams: number | null;
  mealType: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export default function NutritionEntryList({
  entries,
}: {
  entries: NutritionRow[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/nutrition/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-fg-subtle">
        Nothing logged today. Add a meal to start tracking.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">
              {e.name}
              {e.grams ? (
                <span className="text-fg-subtle"> · {e.grams} g</span>
              ) : null}
              {e.mealType ? (
                <span className="ml-2 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-muted">
                  {e.mealType}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-fg-subtle">
              {Math.round(e.calories)} kcal · {Math.round(e.proteinG)}p{" "}
              {Math.round(e.carbsG)}c {Math.round(e.fatG)}f
            </p>
          </div>
          <button
            onClick={() => remove(e.id)}
            disabled={deletingId === e.id}
            className="rounded-lg px-2 py-1 text-xs text-fg-subtle hover:bg-surface-2 hover:text-danger disabled:opacity-50"
            aria-label="Delete entry"
          >
            {deletingId === e.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
