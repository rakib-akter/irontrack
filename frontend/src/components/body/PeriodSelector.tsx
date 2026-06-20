"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
] as const;

export default function PeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(p: string) {
    const next = new URLSearchParams(params.toString());
    next.set("period", p);
    router.push(`/body?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => set(p.value)}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            current === p.value
              ? "bg-accent text-accent-fg"
              : "text-fg-muted hover:text-fg"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
