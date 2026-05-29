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

export interface ChartPoint {
  date: string; // ISO date
  oneRM: number; // estimated 1RM on that day
  label: string; // formatted date for axis
}

export default function LiftChart({
  data,
  unit,
  goal,
}: {
  data: ChartPoint[];
  unit: string;
  goal?: number | null;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No data yet — log a few sessions to see your progress.
      </div>
    );
  }

  const values = data.map((d) => d.oneRM);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? 0);
  const pad = Math.max(10, (max - min) * 0.15);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="orm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
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
            formatter={(v: number) => [`${Math.round(v)} ${unit}`, "Est. 1RM"]}
          />
          {goal ? (
            <ReferenceLine
              y={goal}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${Math.round(goal)} ${unit}`,
                fill: "#fbbf24",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="oneRM"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#orm)"
            dot={{ r: 3, fill: "#34d399" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
