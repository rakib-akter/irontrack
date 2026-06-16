import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";

const upsertSchema = z.object({
  targetWeight: z.number().positive("Target must be positive"),
  unit: z.enum(["lb", "kg"]).default("lb"),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const goal = await prisma.bodyWeightGoal.findUnique({ where: { userId } });
  return ok(goal);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = upsertSchema.parse(await req.json());
    const data = {
      targetWeight: body.targetWeight,
      unit: body.unit,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
    };

    // One goal per user: create it or update the existing one.
    const goal = await prisma.bodyWeightGoal.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return ok(goal, 201);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    await prisma.bodyWeightGoal.deleteMany({ where: { userId } });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
