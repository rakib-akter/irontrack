// The nutrient fields shared between a NutritionEntry and a stored template item.

export const NUTRIENT_FIELDS = [
  "calories",
  "proteinG",
  "carbsG",
  "fatG",
  "fiberG",
  "sodiumMg",
  "potassiumMg",
  "magnesiumMg",
  "calciumMg",
  "ironMg",
  "zincMg",
  "vitaminAUg",
  "vitaminB12Ug",
  "folateUg",
  "vitaminCMg",
  "vitaminDUg",
  "vitaminEMg",
  "vitaminKUg",
  "omega3G",
] as const;

export type NutrientField = (typeof NUTRIENT_FIELDS)[number];

// The micronutrient subset (everything after the five macros).
export const MICRO_FIELDS = NUTRIENT_FIELDS.slice(5);

export interface TemplateItem {
  name: string;
  grams: number | null;
  mealType: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  [key: string]: string | number | null;
}

type EntryLike = {
  name: string;
  grams: number | null;
  mealType: string | null;
} & Record<NutrientField, number | null>;

/** Snapshot a NutritionEntry's storable fields for a template item. */
export function toTemplateItem(e: EntryLike): TemplateItem {
  const item: Record<string, string | number | null> = {
    name: e.name,
    grams: e.grams,
    mealType: e.mealType,
    calories: e.calories ?? 0,
    proteinG: e.proteinG ?? 0,
    carbsG: e.carbsG ?? 0,
    fatG: e.fatG ?? 0,
    fiberG: e.fiberG ?? 0,
  };
  // Copy the micronutrients (macros are already set above).
  for (const f of MICRO_FIELDS) item[f] = e[f] ?? null;
  return item as TemplateItem;
}
