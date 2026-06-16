"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { displayExercise } from "@/lib/exercises";

export interface GoalRow {
  id: string;
  exercise: string;
  targetWeight: number;
  targetReps: number;
  unit: string;
  targetDate: string | null;
  percent: number | null; // progress toward goal, 0..100
  best1RM: number | null;
}

export default function GoalList({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (goals.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No goals yet. Set one to get tailored coaching.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {goals.map((g) => (
        <li key={g.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={`/exercise/${encodeURIComponent(g.exercise)}`}
                className="font-semibold hover:text-emerald-400"
              >
                {displayExercise(g.exercise)}
              </Link>
              <p className="text-sm text-zinc-400">
                Target: {g.targetWeight} {g.unit}
                {g.targetReps > 1 ? ` × ${g.targetReps}` : ""}
                {g.targetDate
                  ? ` by ${new Date(g.targetDate).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => remove(g.id)}
              disabled={deletingId === g.id}
              className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
            >
              {deletingId === g.id ? "…" : "Remove"}
            </button>
          </div>
          {g.percent !== null && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>
                  {g.best1RM !== null
                    ? `Now ~${Math.round(g.best1RM)} ${g.unit} 1RM`
                    : "No data yet"}
                </span>
                <span>{g.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${g.percent}%` }}
                />
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
