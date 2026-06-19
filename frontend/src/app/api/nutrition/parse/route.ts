import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized } from "@/lib/http";
import { parseMeal } from "@/lib/nutrition";

// AI meal parsing. Today it's the rule-based parser; this endpoint is the seam
// where an OpenRouter call (via the FastAPI gateway) can replace/augment it
// while keeping the same response shape.
const schema = z.object({ text: z.string().trim().min(1).max(500) });

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { text } = schema.parse(await req.json());
    const { items, unmatched } = parseMeal(text);
    return ok({
      items,
      unmatched,
      engine: "rule-based",
      confidence: items.length > 0 ? 0.6 : 0.1,
    });
  } catch (e) {
    return handleError(e);
  }
}
