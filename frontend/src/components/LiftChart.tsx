"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  date: string; // ISO date
  label: string; // formatted date for axis
  oneRM?: number | null; // estimated 1RM on that day
  ma?: number | null; // moving average of estimated 1RM
  projected?: number | null; // projected future 1RM (dashed)
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
      <div className="flex h-64 items-center justify-center text-sm text-fg-subtle">
        No data yet — log a few sessions to see your progress.
      </div>
    );
  }

  const nums = data
    .flatMap((d) => [d.oneRM, d.ma, d.projected])
    .filter((v): v is number => typeof v === "number");
  const min = Math.min(...nums, goal ?? Infinity);
  const max = Math.max(...nums, goal ?? 0);
  const pad = Math.max(10, (max - min) * 0.15);

  const hasMA = data.some((d) => typeof d.ma === "number");
  const hasProjection = data.some((d) => typeof d.projected === "number");

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="orm" x1="0" y1="0" x2="0" y2="1">
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
              borderRadius: 10,
              color: "var(--fg)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--fg-muted)" }}
            formatter={(v, name) => [
              `${Math.round(Number(v))} ${unit}`,
              name === "ma"
                ? "Moving avg"
                : name === "projected"
                  ? "Projected"
                  : "Est. 1RM",
            ]}
          />
          {goal ? (
            <ReferenceLine
              y={goal}
              stroke="var(--warning)"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${Math.round(goal)} ${unit}`,
                fill: "var(--warning)",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="oneRM"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#orm)"
            dot={{ r: 3, fill: "var(--accent)" }}
            connectNulls
          />
          {hasMA && (
            <Line
              type="monotone"
              dataKey="ma"
              stroke="var(--fg-muted)"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          )}
          {hasProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
