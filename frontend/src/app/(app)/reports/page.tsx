import { redirect } from "next/navigation";
import { Prisma, type ReportType } from "@prisma/client";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReport, type ReportPeriod } from "@/lib/reports";
import ReportView from "@/components/reports/ReportView";
import ReportPeriodSelector from "@/components/reports/ReportPeriodSelector";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { period: p } = await searchParams;
  const period: ReportPeriod = ["daily", "weekly", "monthly"].includes(p ?? "")
    ? (p as ReportPeriod)
    : "weekly";

  const [lifts, goals, measurements, nutrition, recovery, target] =
    await Promise.all([
      prisma.liftEntry.findMany({ where: { userId } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.bodyMeasurement.findMany({ where: { userId } }),
      prisma.nutritionEntry.findMany({ where: { userId } }),
      prisma.recoveryLog.findMany({ where: { userId } }),
      prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);

  const report = generateReport(period, {
    lifts,
    goals,
    measurements,
    nutrition,
    recovery,
    proteinTarget: target?.proteinG ?? null,
  });

  // Persist a snapshot (one row per user/type/period-start day).
  const periodStart = new Date(report.periodStartISO.slice(0, 10));
  await prisma.report.upsert({
    where: {
      userId_type_periodStart: {
        userId,
        type: period as ReportType,
        periodStart,
      },
    },
    create: {
      userId,
      type: period as ReportType,
      periodStart,
      periodEnd: new Date(report.periodEndISO.slice(0, 10)),
      content: report as unknown as Prisma.InputJsonValue,
    },
    update: { content: report as unknown as Prisma.InputJsonValue },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Intelligence report</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Your wins, misses, predictions, and next actions — synthesized
            across strength, nutrition, body, and recovery.
          </p>
        </div>
        <ReportPeriodSelector current={period} />
      </div>

      <ReportView report={report} />
    </div>
  );
}
