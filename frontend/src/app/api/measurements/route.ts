import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";
import { navyBodyFat, type Sex } from "@/lib/bodycomp";

const createSchema = z.object({
  weight: z.number().positive().max(2000).optional(),
  unit: z.enum(["lb", "kg"]).default("lb"),
  waistCm: z.number().positive().max(300).optional(),
  neckCm: z.number().positive().max(120).optional(),
  hipCm: z.number().positive().max(300).optional(),
  bodyFatPct: z.number().min(2).max(70).optional(),
  performedAt: z.string().datetime().optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { performedAt: "asc" },
  });
  return ok(measurements);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());

    // Auto-estimate body fat from measurements + profile if not provided.
    let bodyFatPct = body.bodyFatPct ?? null;
    if (bodyFatPct === null && body.waistCm && body.neckCm) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { sex: true, heightCm: true },
      });
      bodyFatPct = navyBodyFat({
        sex: (profile?.sex as Sex | null) ?? null,
        heightCm: profile?.heightCm ?? null,
        waistCm: body.waistCm,
        neckCm: body.neckCm,
        hipCm: body.hipCm ?? null,
      });
    }

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId,
        weight: body.weight ?? null,
        unit: body.unit,
        waistCm: body.waistCm ?? null,
        neckCm: body.neckCm ?? null,
        hipCm: body.hipCm ?? null,
        bodyFatPct,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
      },
    });
    return ok(measurement, 201);
  } catch (e) {
    return handleError(e);
  }
}
