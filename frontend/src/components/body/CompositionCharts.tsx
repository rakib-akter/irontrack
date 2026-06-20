"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface WeightPoint {
  label: string;
  weight: number | null;
  trend: number | null;
}
export interface BfPoint {
  label: string;
  bodyFat: number | null;
}
export interface MassPoint {
  label: string;
  lean: number | null;
  fat: number | null;
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 10,
    color: "var(--fg)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--fg-muted)" },
};

function axes() {
  return (
    <>
      <CartesianGrid stroke="var(--border)" vertical={false} />
      <XAxis dataKey="label" stroke="var(--fg-subtle)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--fg-subtle)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
    </>
  );
}

export default function CompositionCharts({
  weight,
  bodyFat,
  mass,
  unit,
}: {
  weight: WeightPoint[];
  bodyFat: BfPoint[];
  mass: MassPoint[];
  unit: string;
}) {
  const hasBf = bodyFat.some((d) => d.bodyFat !== null);
  const hasMass = mass.some((d) => d.lean !== null);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Weight &amp; trend ({unit})
        </h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weight} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
              {axes()}
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="weight" stroke="var(--fg-subtle)" strokeWidth={1} dot={{ r: 2 }} connectNulls name="Weight" />
              <Line type="monotone" dataKey="trend" stroke="var(--accent)" strokeWidth={2.5} dot={false} connectNulls name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hasBf && (
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            Estimated body fat (%)
          </h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyFat} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                {axes()}
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="bodyFat" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls name="Body fat %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasMass && (
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            Lean vs fat mass ({unit})
          </h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mass} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                {axes()}
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="lean" stroke="var(--positive)" strokeWidth={2.5} dot={{ r: 2 }} connectNulls name="Lean mass" />
                <Line type="monotone" dataKey="fat" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 2 }} connectNulls name="Fat mass" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
