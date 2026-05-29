"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BodyWeightRow {
  id: string;
  weight: number;
  unit: string;
  notes: string | null;
  performedAt: string; // ISO
}

export default function BodyWeightList({ entries }: { entries: BodyWeightRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bodyweight/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No measurements logged yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">
              {e.weight} {e.unit}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(e.performedAt).toLocaleDateString()}
              {e.notes ? ` · ${e.notes}` : ""}
            </p>
          </div>
          <button
            onClick={() => remove(e.id)}
            disabled={deletingId === e.id}
            className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
            aria-label="Delete entry"
          >
            {deletingId === e.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
