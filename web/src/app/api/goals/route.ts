import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";
import { normalizeExercise } from "@/lib/exercises";

const createSchema = z.object({
  exercise: z.string().trim().min(1).max(80),
  targetWeight: z.number().positive(),
  targetReps: z.number().int().min(1).max(20).default(1),
  unit: z.enum(["lb", "kg"]).default("lb"),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return ok(goals);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    const exercise = normalizeExercise(body.exercise);

    // One active goal per exercise: replace any existing one.
    await prisma.goal.deleteMany({ where: { userId, exercise } });

    const goal = await prisma.goal.create({
      data: {
        userId,
        exercise,
        targetWeight: body.targetWeight,
        targetReps: body.targetReps,
        unit: body.unit,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      },
    });
    return ok(goal, 201);
  } catch (e) {
    return handleError(e);
  }
}
