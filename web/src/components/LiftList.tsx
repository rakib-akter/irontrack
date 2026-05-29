"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { displayExercise } from "@/lib/exercises";
import { estimateOneRepMax } from "@/lib/strength";

export interface LiftRow {
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  unit: string;
  notes: string | null;
  performedAt: string; // ISO
}

export default function LiftList({
  lifts,
  showExercise = true,
}: {
  lifts: LiftRow[];
  showExercise?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lifts/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (lifts.length === 0) {
    return <p className="text-sm text-zinc-500">No lifts logged yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {lifts.map((l) => (
        <li key={l.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">
              {showExercise && (
                <span>{displayExercise(l.exercise)} · </span>
              )}
              {l.weight} {l.unit} × {l.reps}
              {l.sets > 1 ? ` (${l.sets} sets)` : ""}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(l.performedAt).toLocaleDateString()} · est. 1RM{" "}
              {Math.round(estimateOneRepMax(l.weight, l.reps))} {l.unit}
              {l.notes ? ` · ${l.notes}` : ""}
            </p>
          </div>
          <button
            onClick={() => remove(l.id)}
            disabled={deletingId === l.id}
            className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
            aria-label="Delete lift"
          >
            {deletingId === l.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
