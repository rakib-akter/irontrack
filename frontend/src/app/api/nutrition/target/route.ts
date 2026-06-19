import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";

const schema = z.object({
  calories: z.number().positive().max(20000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(1000),
  fiberG: z.number().min(0).max(200).optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const target = await prisma.nutritionTarget.findUnique({ where: { userId } });
  return ok(target);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = schema.parse(await req.json());
    const data = {
      calories: body.calories,
      proteinG: body.proteinG,
      carbsG: body.carbsG,
      fatG: body.fatG,
      fiberG: body.fiberG ?? null,
    };
    const target = await prisma.nutritionTarget.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return ok(target, 201);
  } catch (e) {
    return handleError(e);
  }
}
