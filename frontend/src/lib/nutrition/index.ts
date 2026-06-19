// Nutrition computation: reference daily values, totals, micronutrient coverage,
// a nutrition quality score, and a rule-based meal-text parser. Pure functions.
// The parser is the seam where the AI gateway can later do smarter extraction.

import { FOODS, nutrientsForGrams, type Nutrients } from "./foods";

export * from "./foods";

// ---- Reference daily values (adult) ----

export interface MicroDef {
  key: keyof NutrientTotals;
  label: string;
  unit: string;
  dv: number; // reference daily value
  limit?: boolean; // true = a nutrient to stay under (e.g. sodium)
}

export const MICROS: MicroDef[] = [
  { key: "sodiumMg", label: "Sodium", unit: "mg", dv: 2300, limit: true },
  { key: "potassiumMg", label: "Potassium", unit: "mg", dv: 3500 },
  { key: "magnesiumMg", label: "Magnesium", unit: "mg", dv: 400 },
  { key: "calciumMg", label: "Calcium", unit: "mg", dv: 1000 },
  { key: "ironMg", label: "Iron", unit: "mg", dv: 18 },
  { key: "zincMg", label: "Zinc", unit: "mg", dv: 11 },
  { key: "vitaminAUg", label: "Vitamin A", unit: "µg", dv: 900 },
  { key: "vitaminB12Ug", label: "Vitamin B12", unit: "µg", dv: 2.4 },
  { key: "folateUg", label: "Folate", unit: "µg", dv: 400 },
  { key: "vitaminCMg", label: "Vitamin C", unit: "mg", dv: 90 },
  { key: "vitaminDUg", label: "Vitamin D", unit: "µg", dv: 20 },
  { key: "vitaminEMg", label: "Vitamin E", unit: "mg", dv: 15 },
  { key: "vitaminKUg", label: "Vitamin K", unit: "µg", dv: 120 },
  { key: "omega3G", label: "Omega-3", unit: "g", dv: 1.6 },
];

export interface NutrientTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  calciumMg: number;
  ironMg: number;
  zincMg: number;
  vitaminAUg: number;
  vitaminB12Ug: number;
  folateUg: number;
  vitaminCMg: number;
  vitaminDUg: number;
  vitaminEMg: number;
  vitaminKUg: number;
  omega3G: number;
}

const TOTAL_KEYS = [
  "calories",
  "proteinG",
  "carbsG",
  "fatG",
  "fiberG",
  ...MICROS.map((m) => m.key),
] as (keyof NutrientTotals)[];

export function emptyTotals(): NutrientTotals {
  const t = {} as NutrientTotals;
  for (const k of TOTAL_KEYS) t[k] = 0;
  return t;
}

/** Sum nutrient rows (DB entries or parsed items); null/undefined treated as 0. */
export function sumNutrients(
  rows: Array<Partial<Record<keyof NutrientTotals, number | null>>>,
): NutrientTotals {
  const t = emptyTotals();
  for (const row of rows) {
    for (const k of TOTAL_KEYS) {
      t[k] += row[k] ?? 0;
    }
  }
  for (const k of TOTAL_KEYS) t[k] = Math.round(t[k] * 100) / 100;
  return t;
}

/** Percentage of each micronutrient's daily value (uncapped). */
export function microPercents(totals: NutrientTotals): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of MICROS) {
    out[m.key] = Math.round(((totals[m.key] || 0) / m.dv) * 100);
  }
  return out;
}

/**
 * Nutrition quality score (0-100): protein adequacy, fiber, micronutrient
 * coverage, and not blowing past the sodium limit.
 */
export function nutritionQualityScore(
  totals: NutrientTotals,
  targetProteinG?: number | null,
): number {
  const proteinTarget = targetProteinG && targetProteinG > 0 ? targetProteinG : 140;
  const proteinScore = Math.min(1, totals.proteinG / proteinTarget);
  const fiberScore = Math.min(1, totals.fiberG / 30);

  const goodMicros = MICROS.filter((m) => !m.limit);
  const hit = goodMicros.filter(
    (m) => (totals[m.key] || 0) / m.dv >= 0.5,
  ).length;
  const microScore = hit / goodMicros.length;

  const sodiumScore = totals.sodiumMg <= 2300 ? 1 : 0.5;

  const score =
    0.3 * proteinScore + 0.2 * fiberScore + 0.4 * microScore + 0.1 * sodiumScore;
  return Math.round(score * 100);
}

// ---- Rule-based meal parser ----

export interface ParsedItem {
  foodKey: string;
  name: string;
  grams: number;
  nutrients: Nutrients;
}

const COUNT_FOODS = new Set(["egg", "banana", "apple", "orange"]);

/** Parse a free-text meal like "2 eggs + rice + 150g chicken" into items. */
export function parseMeal(text: string): {
  items: ParsedItem[];
  unmatched: string[];
} {
  const chunks = text
    .split(/[+,\n]| and /i)
    .map((c) => c.trim())
    .filter(Boolean);

  const items: ParsedItem[] = [];
  const unmatched: string[] = [];

  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();

    // Find the best (longest) matching food alias.
    let match: { food: (typeof FOODS)[number]; alias: string } | null = null;
    for (const food of FOODS) {
      for (const alias of food.aliases) {
        if (lower.includes(alias)) {
          if (!match || alias.length > match.alias.length) {
            match = { food, alias };
          }
        }
      }
    }
    if (!match) {
      unmatched.push(chunk);
      continue;
    }

    // Parse an optional leading quantity + unit.
    const qty = lower.match(/(\d+(?:\.\d+)?)\s*(g|grams?|oz|cups?)?/);
    let grams = match.food.servingGrams;
    if (qty) {
      const n = parseFloat(qty[1]);
      const unit = qty[2];
      if (unit?.startsWith("g")) grams = n;
      else if (unit === "oz") grams = n * 28.35;
      else if (unit?.startsWith("cup")) grams = n * 200;
      else if (COUNT_FOODS.has(match.food.key))
        grams = n * match.food.servingGrams; // a count, e.g. "2 eggs"
      else grams = n >= 30 ? n : n * match.food.servingGrams; // "150 chicken" => 150g
    }

    items.push({
      foodKey: match.food.key,
      name: match.food.name,
      grams: Math.round(grams),
      nutrients: nutrientsForGrams(match.food, grams),
    });
  }

  return { items, unmatched };
}
