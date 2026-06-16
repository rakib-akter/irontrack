import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogLiftForm from "@/components/LogLiftForm";
import LiftList, { type LiftRow } from "@/components/LiftList";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const lifts = await prisma.liftEntry.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    take: 15,
  });

  const rows: LiftRow[] = lifts.map((l) => ({
    id: l.id,
    exercise: l.exercise,
    weight: l.weight,
    reps: l.reps,
    sets: l.sets,
    unit: l.unit,
    notes: l.notes,
    performedAt: l.performedAt.toISOString(),
  }));

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Log a lift</h1>
        <LogLiftForm />
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent</h2>
        <div className="card">
          <LiftList lifts={rows} />
        </div>
      </div>
    </div>
  );
}
