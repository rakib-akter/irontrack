"use client";

import type { IntelligenceReport } from "@/lib/reports";

function toMarkdown(r: IntelligenceReport): string {
  const d = (iso: string) => new Date(iso).toLocaleDateString();
  const section = (title: string, items: string[]) =>
    `## ${title}\n` +
    (items.length ? items.map((i) => `- ${i}`).join("\n") : "- —") +
    "\n";
  const cap = r.period.charAt(0).toUpperCase() + r.period.slice(1);
  return [
    `# STRATUM ${cap} Report`,
    `${d(r.periodStartISO)} – ${d(r.periodEndISO)}`,
    "",
    section("🏆 Wins", r.wins),
    section("⚠️ Misses", r.misses),
    section("🔮 Predictions", r.predictions),
    section("🎯 Next actions", r.nextActions),
  ].join("\n");
}

export default function ExportButton({
  report,
}: {
  report: IntelligenceReport;
}) {
  function download() {
    const blob = new Blob([toMarkdown(report)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stratum-${report.period}-report-${report.periodEndISO.slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button onClick={download} className="btn-ghost whitespace-nowrap">
        ⬇ Export
      </button>
      <button
        onClick={() => window.print()}
        className="btn-ghost whitespace-nowrap"
      >
        🖨 Print
      </button>
    </div>
  );
}
