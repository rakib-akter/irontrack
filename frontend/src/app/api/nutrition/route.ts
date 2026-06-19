import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";
import { foodByKey, nutrientsForGrams, type Nutrients } from "@/lib/nutrition";

const createSchema = z.object({
  // Either log a food from the DB by key (server computes nutrients)...
  foodKey: z.string().optional(),
  grams: z.number().positive().max(5000).optional(),
  // ...or provide a manual entry.
  name: z.string().trim().max(120).optional(),
  calories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  fiberG: z.number().min(0).optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  source: z.enum(["manual", "template", "barcode", "ai"]).optional(),
  loggedAt: z.string().datetime().optional(),
});

// Map a Nutrients object's optional micros to Prisma's null-able columns.
function microData(n: Nutrients) {
  const f = (v: number | undefined) => (v === undefined ? null : v);
  return {
    sodiumMg: f(n.sodiumMg),
    potassiumMg: f(n.potassiumMg),
    magnesiumMg: f(n.magnesiumMg),
    calciumMg: f(n.calciumMg),
    ironMg: f(n.ironMg),
    zincMg: f(n.zincMg),
    vitaminAUg: f(n.vitaminAUg),
    vitaminB12Ug: f(n.vitaminB12Ug),
    folateUg: f(n.folateUg),
    vitaminCMg: f(n.vitaminCMg),
    vitaminDUg: f(n.vitaminDUg),
    vitaminEMg: f(n.vitaminEMg),
    vitaminKUg: f(n.vitaminKUg),
    omega3G: f(n.omega3G),
  };
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const date = new URL(req.url).searchParams.get("date"); // YYYY-MM-DD
  let where: Record<string, unknown> = { userId };
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start.getTime() + 86_400_000);
    where = { userId, loggedAt: { gte: start, lt: end } };
  }

  const entries = await prisma.nutritionEntry.findMany({
    where,
    orderBy: { loggedAt: "asc" },
  });
  return ok(entries);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    const loggedAt = body.loggedAt ? new Date(body.loggedAt) : new Date();

    if (body.foodKey) {
      const food = foodByKey(body.foodKey);
      if (!food) return error("Unknown food", 400);
      const grams = body.grams ?? food.servingGrams;
      const n = nutrientsForGrams(food, grams);
      const entry = await prisma.nutritionEntry.create({
        data: {
          userId,
          name: body.name?.trim() || food.name,
          grams,
          mealType: body.mealType ?? null,
          source: body.source ?? "manual",
          calories: n.calories,
          proteinG: n.proteinG,
          carbsG: n.carbsG,
          fatG: n.fatG,
          fiberG: n.fiberG,
          ...microData(n),
          loggedAt,
        },
      });
      return ok(entry, 201);
    }

    // Manual entry.
    if (!body.name || body.calories === undefined) {
      return error("Provide a foodKey, or a name and calories", 422);
    }
    const entry = await prisma.nutritionEntry.create({
      data: {
        userId,
        name: body.name.trim(),
        grams: body.grams ?? null,
        mealType: body.mealType ?? null,
        source: body.source ?? "manual",
        calories: body.calories,
        proteinG: body.proteinG ?? 0,
        carbsG: body.carbsG ?? 0,
        fatG: body.fatG ?? 0,
        fiberG: body.fiberG ?? 0,
        loggedAt,
      },
    });
    return ok(entry, 201);
  } catch (e) {
    return handleError(e);
  }
}
