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

export interface BodyWeightPoint {
  date: string; // ISO date
  weight: number;
  label: string; // formatted date for axis
}

export default function BodyWeightChart({
  data,
  unit,
}: {
  data: BodyWeightPoint[];
  unit: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No measurements yet — log your weight to see the trend.
      </div>
    );
  }

  const values = data.map((d) => d.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(2, (max - min) * 0.2);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v) => [`${Number(v)} ${unit}`, "Body weight"]}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#bw)"
            dot={{ r: 3, fill: "#60a5fa" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
