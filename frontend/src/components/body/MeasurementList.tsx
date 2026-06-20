"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MeasurementRow {
  id: string;
  weight: number | null;
  unit: string;
  waistCm: number | null;
  neckCm: number | null;
  bodyFatPct: number | null;
  performedAt: string;
}

export default function MeasurementList({ rows }: { rows: MeasurementRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/measurements/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-fg-subtle">No measurements logged yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((m) => (
        <li key={m.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">
              {m.weight !== null ? `${m.weight} ${m.unit}` : "—"}
              {m.bodyFatPct !== null && (
                <span className="ml-2 text-accent">{m.bodyFatPct}% BF</span>
              )}
            </p>
            <p className="text-xs text-fg-subtle">
              {new Date(m.performedAt).toLocaleDateString()}
              {m.waistCm ? ` · waist ${m.waistCm}cm` : ""}
              {m.neckCm ? ` · neck ${m.neckCm}cm` : ""}
            </p>
          </div>
          <button
            onClick={() => remove(m.id)}
            disabled={deletingId === m.id}
            className="rounded-lg px-2 py-1 text-xs text-fg-subtle hover:bg-surface-2 hover:text-danger disabled:opacity-50"
          >
            {deletingId === m.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
