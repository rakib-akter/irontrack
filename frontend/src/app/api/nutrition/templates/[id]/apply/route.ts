import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";
import {
  NUTRIENT_FIELDS,
  type TemplateItem,
} from "@/lib/nutrition/entryFields";

// Re-log all of a template's items into today.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();
    const { id } = await params;

    const template = await prisma.mealTemplate.findFirst({
      where: { id, userId },
    });
    if (!template) return error("Not found", 404);

    const items = template.items as unknown as TemplateItem[];
    const now = new Date();

    const data = items.map((it) => {
      const row: Record<string, unknown> = {
        userId,
        name: it.name,
        grams: it.grams ?? null,
        mealType: it.mealType ?? null,
        source: "template",
        loggedAt: now,
      };
      for (const f of NUTRIENT_FIELDS) {
        row[f] = f === "calories" ? (it.calories ?? 0) : (it[f] ?? null);
      }
      // Macros are non-null columns; coerce.
      row.proteinG = it.proteinG ?? 0;
      row.carbsG = it.carbsG ?? 0;
      row.fatG = it.fatG ?? 0;
      row.fiberG = it.fiberG ?? 0;
      return row;
    });

    await prisma.nutritionEntry.createMany({
      data: data as never,
    });
    return ok({ added: data.length }, 201);
  } catch (e) {
    return handleError(e);
  }
}
