// Presentational (server) component: renders PR history, rep maxes, and volume
// stats for one exercise. All inputs are serializable (dates as ISO strings).

export interface PRRow {
  performedAt: string;
  weight: number;
  reps: number;
  oneRM: number;
}

export interface RepMaxRow {
  reps: number;
  weight: number;
  performedAt: string;
}

export interface VolumeSummary {
  totalVolume: number;
  sessions: number;
  bestSessionVolume: number | null;
  lastSessionVolume: number | null;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

export default function ExerciseStats({
  unit,
  prs,
  repMaxes,
  volume,
}: {
  unit: string;
  prs: PRRow[];
  repMaxes: RepMaxRow[];
  volume: VolumeSummary;
}) {
  return (
    <div className="space-y-6">
      {/* Volume */}
      <div className="card">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Volume
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total" value={`${fmt(volume.totalVolume)} ${unit}`} />
          <Stat label="Sessions" value={String(volume.sessions)} />
          <Stat
            label="Best session"
            value={
              volume.bestSessionVolume !== null
                ? `${fmt(volume.bestSessionVolume)} ${unit}`
                : "—"
            }
          />
          <Stat
            label="Last session"
            value={
              volume.lastSessionVolume !== null
                ? `${fmt(volume.lastSessionVolume)} ${unit}`
                : "—"
            }
          />
        </div>
        <p className="mt-3 text-xs text-fg-subtle">
          Volume = weight × reps × sets, summed across each session.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rep maxes */}
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            Rep maxes
          </h2>
          {repMaxes.length === 0 ? (
            <p className="text-sm text-fg-subtle">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[18rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-fg-subtle">
                  <th className="pb-1 font-medium">Reps</th>
                  <th className="pb-1 font-medium">Best weight</th>
                  <th className="pb-1 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {repMaxes.map((r) => (
                  <tr key={r.reps} className="border-t border-border">
                    <td className="py-1.5">{r.reps}</td>
                    <td className="py-1.5 font-medium text-fg">
                      {r.weight} {unit}
                    </td>
                    <td className="py-1.5 text-fg-subtle">
                      {shortDate(r.performedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* PR history */}
        <div className="card">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
            PR history (estimated 1RM)
          </h2>
          {prs.length === 0 ? (
            <p className="text-sm text-fg-subtle">No PRs yet.</p>
          ) : (
            <ol className="space-y-2">
              {prs.map((pr, i) => (
                <li
                  key={`${pr.performedAt}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-fg">
                    <span className="font-semibold text-accent">
                      {Math.round(pr.oneRM)} {unit}
                    </span>{" "}
                    <span className="text-fg-subtle">
                      ({pr.weight} × {pr.reps})
                    </span>
                  </span>
                  <span className="text-xs text-fg-subtle">
                    {shortDate(pr.performedAt)}
                    {i === 0 ? " · current" : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
