import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";
import { toTemplateItem } from "@/lib/nutrition/entryFields";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const templates = await prisma.mealTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return ok(templates);
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  // Snapshot the given day's entries (defaults to today).
  date: z.string().optional(), // YYYY-MM-DD
});

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    const start = body.date ? new Date(`${body.date}T00:00:00`) : new Date();
    if (!body.date) start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86_400_000);

    const entries = await prisma.nutritionEntry.findMany({
      where: { userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: "asc" },
    });
    if (entries.length === 0) {
      return error("No foods logged that day to save", 400);
    }

    const items = entries.map(toTemplateItem);
    const template = await prisma.mealTemplate.create({
      data: {
        userId,
        name: body.name,
        items: items as unknown as Prisma.InputJsonValue,
      },
    });
    return ok(template, 201);
  } catch (e) {
    return handleError(e);
  }
}
