"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface VolumePoint {
  date: string; // ISO date
  volume: number; // total volume that day (weight x reps x sets)
  label: string; // formatted date for axis
}

export default function VolumeChart({
  data,
  unit,
}: {
  data: VolumePoint[];
  unit: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-fg-subtle">
        No sessions yet — log some sets to see your volume.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            width={56}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10, color: "var(--fg)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--fg-muted)" }}
            formatter={(v) => [
              `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`,
              "Volume",
            ]}
          />
          <Bar dataKey="volume" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
