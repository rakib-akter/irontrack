import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";
import { normalizeExercise } from "@/lib/exercises";

const upsertSchema = z.object({
  exercise: z.string().trim().min(1).max(80),
  weeklyVolume: z.number().positive("Weekly volume must be positive"),
  unit: z.enum(["lb", "kg"]).default("lb"),
});

// GET /api/volume-goals            -> all of the user's volume goals
// GET /api/volume-goals?exercise=X -> just that exercise's goal (or null)
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const exercise = new URL(req.url).searchParams.get("exercise");
  if (exercise) {
    const goal = await prisma.volumeGoal.findUnique({
      where: {
        userId_exercise: { userId, exercise: normalizeExercise(exercise) },
      },
    });
    return ok(goal);
  }
  const goals = await prisma.volumeGoal.findMany({ where: { userId } });
  return ok(goals);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = upsertSchema.parse(await req.json());
    const exercise = normalizeExercise(body.exercise);
    const data = { weeklyVolume: body.weeklyVolume, unit: body.unit };

    const goal = await prisma.volumeGoal.upsert({
      where: { userId_exercise: { userId, exercise } },
      create: { userId, exercise, ...data },
      update: data,
    });
    return ok(goal, 201);
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/volume-goals?exercise=X
export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const exercise = new URL(req.url).searchParams.get("exercise");
    if (!exercise) return error("exercise query param is required", 400);

    await prisma.volumeGoal.deleteMany({
      where: { userId, exercise: normalizeExercise(exercise) },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
