"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BodyWeightPoint {
  date: string; // ISO date
  weight: number;
  label: string; // formatted date for axis
}

export default function BodyWeightChart({
  data,
  unit,
  goal,
}: {
  data: BodyWeightPoint[];
  unit: string;
  goal?: number | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-fg-subtle">
        No measurements yet — log your weight to see the trend.
      </div>
    );
  }

  const values = data.map((d) => d.weight);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? -Infinity);
  const pad = Math.max(2, (max - min) * 0.2);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--fg-subtle)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--fg-subtle)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10, color: "var(--fg)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--fg-muted)" }}
            formatter={(v) => [`${Number(v)} ${unit}`, "Body weight"]}
          />
          {goal ? (
            <ReferenceLine
              y={goal}
              stroke="var(--warning)"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${goal} ${unit}`,
                fill: "var(--warning)",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="weight"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#bw)"
            dot={{ r: 3, fill: "var(--accent)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
