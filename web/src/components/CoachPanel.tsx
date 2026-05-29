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
      <div className="card animate-pulse text-sm text-zinc-500">
        Analyzing your training…
      </div>
    );
  if (error)
    return <div className="card text-sm text-red-400">{error}</div>;
  if (!result) return null;

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-semibold">AI Coach</h2>
      </div>

      {result.feedback.length > 0 && (
        <ul className="space-y-2 text-sm text-zinc-200">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-400">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {result.nextSession && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">
            Next session plan
          </h3>
          <p className="mb-3 text-xs text-zinc-400">
            {result.nextSession.warmup}
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-zinc-500">
                <th className="pb-1 font-medium">Sets</th>
                <th className="pb-1 font-medium">Weight</th>
                <th className="pb-1 font-medium">Reps</th>
              </tr>
            </thead>
            <tbody>
              {result.nextSession.workingSets.map((s, i) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td className="py-1.5">{s.sets}</td>
                  <td className="py-1.5 font-medium text-zinc-100">
                    {s.weight}
                  </td>
                  <td className="py-1.5">{s.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-zinc-400">
            {result.nextSession.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
