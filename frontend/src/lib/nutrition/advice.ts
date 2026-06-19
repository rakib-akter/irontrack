// Nutrition advice: explain which nutrients are low and suggest practical foods
// from the database that are rich in them. Rule-based now; the seam where the AI
// gateway can later generate richer, personalized guidance.

import { FOODS, type Nutrients } from "./foods";
import { MICROS, type NutrientTotals } from "./index";

export interface AdviceItem {
  tone: "warning" | "info";
  text: string;
}

/** Top foods richest in a given nutrient (per 100g), as display names. */
function richestFoods(key: keyof Nutrients, n = 2): string[] {
  return FOODS.filter((f) => (f.per100[key] ?? 0) > 0)
    .sort((a, b) => (b.per100[key] ?? 0) - (a.per100[key] ?? 0))
    .slice(0, n)
    .map((f) => f.name);
}

export interface NutritionAdvice {
  items: AdviceItem[];
  confidence: number; // 0..1
}

export function nutritionAdvice(
  totals: NutrientTotals,
  entryCount: number,
  targetProteinG?: number | null,
  targetFiberG?: number | null,
): NutritionAdvice {
  const items: AdviceItem[] = [];

  // Protein adequacy.
  const proteinTarget = targetProteinG && targetProteinG > 0 ? targetProteinG : 140;
  if (totals.proteinG < 0.8 * proteinTarget) {
    items.push({
      tone: "warning",
      text: `Protein is low (${Math.round(totals.proteinG)} of ${Math.round(
        proteinTarget,
      )} g). Add ${richestFoods("proteinG", 2).join(" or ")}.`,
    });
  }

  // Fiber.
  const fiberTarget = targetFiberG && targetFiberG > 0 ? targetFiberG : 30;
  if (totals.fiberG < 0.6 * fiberTarget) {
    items.push({
      tone: "info",
      text: `Fiber is on the low side (${Math.round(totals.fiberG)} of ${Math.round(
        fiberTarget,
      )} g). Try ${richestFoods("fiberG", 2).join(" or ")}.`,
    });
  }

  // Low micronutrients (good nutrients below 50% of daily value), worst first.
  const lows = MICROS.filter((m) => !m.limit)
    .map((m) => ({ m, pct: ((totals[m.key] || 0) / m.dv) * 100 }))
    .filter((x) => x.pct < 50)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  for (const { m, pct } of lows) {
    const foods = richestFoods(m.key, 2);
    if (foods.length === 0) continue;
    items.push({
      tone: "info",
      text: `${m.label} is at ${Math.round(pct)}% of your daily target — ${foods.join(
        " and ",
      )} are good sources.`,
    });
  }

  // Sodium over the limit.
  if (totals.sodiumMg > 2300) {
    items.push({
      tone: "warning",
      text: `Sodium is over the daily limit (${Math.round(totals.sodiumMg)} mg). Ease off salty and processed foods.`,
    });
  }

  // Confidence scales with how much was logged today.
  const confidence =
    entryCount === 0 ? 0.1 : Math.min(0.7, 0.3 + entryCount * 0.1);

  return { items: items.slice(0, 5), confidence };
}
