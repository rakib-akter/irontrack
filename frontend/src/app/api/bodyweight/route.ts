import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";

const createSchema = z.object({
  weight: z.number().positive("Weight must be positive"),
  unit: z.enum(["lb", "kg"]).default("lb"),
  notes: z.string().trim().max(500).optional(),
  performedAt: z.string().datetime().optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const entries = await prisma.bodyWeightEntry.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
  });
  return ok(entries);
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    const entry = await prisma.bodyWeightEntry.create({
      data: {
        userId,
        weight: body.weight,
        unit: body.unit,
        notes: body.notes || null,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
      },
    });
    return ok(entry, 201);
  } catch (e) {
    return handleError(e);
  }
}
