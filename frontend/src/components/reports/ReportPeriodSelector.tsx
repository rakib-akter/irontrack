"use client";

import { useRouter } from "next/navigation";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export default function ReportPeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => router.push(`/reports?period=${p.value}`)}
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
