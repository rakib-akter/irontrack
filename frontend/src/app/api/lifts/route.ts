import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";
import { normalizeExercise } from "@/lib/exercises";

const createSchema = z.object({
  exercise: z.string().trim().min(1, "Exercise is required").max(80),
  weight: z.number().positive("Weight must be positive"),
  reps: z.number().int().min(1).max(100),
  sets: z.number().int().min(1).max(50).default(1),
  unit: z.enum(["lb", "kg"]).default("lb"),
  notes: z.string().trim().max(500).optional(),
  performedAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const url = new URL(req.url);
  const exercise = url.searchParams.get("exercise");

  const lifts = await prisma.liftEntry.findMany({
    where: {
      userId,
      ...(exercise ? { exercise: normalizeExercise(exercise) } : {}),
    },
    orderBy: { performedAt: "desc" },
  });
  return ok(lifts);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    const lift = await prisma.liftEntry.create({
      data: {
        userId,
        exercise: normalizeExercise(body.exercise),
        weight: body.weight,
        reps: body.reps,
        sets: body.sets,
        unit: body.unit,
        notes: body.notes || null,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
      },
    });
    return ok(lift, 201);
  } catch (e) {
    return handleError(e);
  }
}
