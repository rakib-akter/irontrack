import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";
import { normalizeExercise } from "@/lib/exercises";
import { getCoach } from "@/lib/coach";

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const url = new URL(req.url);
    const exerciseParam = url.searchParams.get("exercise");
    if (!exerciseParam) return error("exercise query param is required", 400);
    const exercise = normalizeExercise(exerciseParam);

    const [lifts, goal] = await Promise.all([
      prisma.liftEntry.findMany({
        where: { userId, exercise },
        orderBy: { performedAt: "asc" },
      }),
      prisma.goal.findFirst({ where: { userId, exercise } }),
    ]);

    const coach = getCoach();
    const result = await coach.analyze({
      exercise,
      unit: goal?.unit ?? lifts[0]?.unit ?? "lb",
      goal: goal
        ? {
            targetWeight: goal.targetWeight,
            targetReps: goal.targetReps,
            targetDate: goal.targetDate,
          }
        : null,
      history: lifts.map((l) => ({
        weight: l.weight,
        reps: l.reps,
        sets: l.sets,
        performedAt: l.performedAt,
      })),
    });

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
