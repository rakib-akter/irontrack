import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const logs = await prisma.recoveryLog.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return ok(logs);
}

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  steps: z.number().int().min(0).max(100000).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  soreness: z.number().int().min(1).max(5).optional(),
  restingHr: z.number().int().min(20).max(200).optional(),
  notes: z.string().trim().max(300).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = schema.parse(await req.json());
    const date = new Date(`${body.date}T00:00:00Z`);
    const data = {
      sleepHours: body.sleepHours ?? null,
      sleepQuality: body.sleepQuality ?? null,
      stress: body.stress ?? null,
      steps: body.steps ?? null,
      energy: body.energy ?? null,
      soreness: body.soreness ?? null,
      restingHr: body.restingHr ?? null,
      notes: body.notes ?? null,
    };
    const log = await prisma.recoveryLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
    return ok(log, 201);
  } catch (e) {
    return handleError(e);
  }
}
