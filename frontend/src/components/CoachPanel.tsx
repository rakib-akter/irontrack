"use client";

import { useEffect, useState } from "react";
import type { CoachResult } from "@/lib/coach/types";

export default function CoachPanel({ exercise }: { exercise: string }) {
  const [result, setResult] = useState<CoachResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/coach?exercise=${encodeURIComponent(exercise)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(data.error ?? "Could not load coaching");
        else setResult(data as CoachResult);
      })
      .catch(() => !cancelled && setError("Network error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [exercise]);

  if (loading)
    return (
      <div className="card animate-pulse text-sm text-fg-subtle">
        Analyzing your training…
      </div>
    );
  if (error)
    return <div className="card text-sm text-danger">{error}</div>;
  if (!result) return null;

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-semibold">AI Coach</h2>
      </div>

      {result.feedback.length > 0 && (
        <ul className="space-y-2 text-sm text-fg">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {result.nextSession && (
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <h3 className="mb-2 text-sm font-semibold text-accent">
            Next session plan
          </h3>
          <p className="mb-3 text-xs text-fg-muted">
            {result.nextSession.warmup}
          </p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[16rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-fg-subtle">
                <th className="pb-1 font-medium">Sets</th>
                <th className="pb-1 font-medium">Weight</th>
                <th className="pb-1 font-medium">Reps</th>
              </tr>
            </thead>
            <tbody>
              {result.nextSession.workingSets.map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1.5">{s.sets}</td>
                  <td className="py-1.5 font-medium text-fg">
                    {s.weight}
                  </td>
                  <td className="py-1.5">{s.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            {result.nextSession.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
