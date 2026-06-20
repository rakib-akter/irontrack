import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";

const schema = z.object({
  primaryGoal: z
    .enum(["strength", "hypertrophy", "fat_loss", "recomposition", "general_health"])
    .optional(),
  trainingLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  units: z.enum(["lb", "kg"]).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  heightCm: z.number().positive().max(260).optional(),
  equipment: z.array(z.string().max(40)).max(20).optional(),
  injuries: z.array(z.string().max(60)).max(20).optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return ok(profile);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = schema.parse(await req.json());
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...body, onboardedAt: new Date() },
      update: { ...body, onboardedAt: new Date() },
    });
    return ok(profile, 201);
  } catch (e) {
    return handleError(e);
  }
}
