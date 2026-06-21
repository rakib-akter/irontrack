"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface RecoveryRow {
  id: string;
  date: string;
  score: number | null;
  sleepHours: number | null;
  soreness: number | null;
}

export default function RecoveryList({ rows }: { rows: RecoveryRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/recovery/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-fg-subtle">No check-ins yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between py-2.5">
          <div>
            <p className="font-medium">
              {new Date(r.date).toLocaleDateString()}
              {r.score !== null && (
                <span className="ml-2 text-accent">{r.score}</span>
              )}
            </p>
            <p className="text-xs text-fg-subtle">
              {r.sleepHours != null ? `${r.sleepHours}h sleep` : "—"}
              {r.soreness != null ? ` · soreness ${r.soreness}/5` : ""}
            </p>
          </div>
          <button
            onClick={() => remove(r.id)}
            disabled={deletingId === r.id}
            className="rounded-lg px-2 py-1 text-xs text-fg-subtle hover:bg-surface-2 hover:text-danger disabled:opacity-50"
          >
            {deletingId === r.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
