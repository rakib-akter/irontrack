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
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No sessions yet — log some sets to see your volume.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }}
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v) => [
              `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`,
              "Volume",
            ]}
          />
          <Bar dataKey="volume" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
