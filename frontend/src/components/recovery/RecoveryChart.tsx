"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface RecoveryPoint {
  label: string;
  score: number;
}

export default function RecoveryChart({ data }: { data: RecoveryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-fg-subtle">
        Log a few days to see your recovery trend.
      </div>
    );
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="rec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--fg-subtle)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="var(--fg-subtle)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--fg)", fontSize: 12 }}
            labelStyle={{ color: "var(--fg-muted)" }}
            formatter={(v) => [`${v}`, "Recovery"]}
          />
          <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} fill="url(#rec)" dot={{ r: 3, fill: "var(--accent)" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
