// A small curated food database (per-100g nutrients) for manual logging and
// rule-based meal parsing. Values are approximate, USDA-style. Micros are
// optional — we never fear missing data. A real deployment can swap this for a
// USDA / OpenFoodFacts integration; the rest of the app only depends on the
// `Nutrients` shape.

export interface Nutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg?: number;
  potassiumMg?: number;
  magnesiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  zincMg?: number;
  vitaminAUg?: number;
  vitaminB12Ug?: number;
  folateUg?: number;
  vitaminCMg?: number;
  vitaminDUg?: number;
  vitaminEMg?: number;
  vitaminKUg?: number;
  omega3G?: number;
}

export interface Food {
  key: string;
  name: string;
  aliases: string[]; // lowercased keywords the parser matches
  servingGrams: number; // a typical portion
  per100: Nutrients;
}

export const FOODS: Food[] = [
  {
    key: "chicken-breast",
    name: "Chicken breast",
    aliases: ["chicken", "chicken breast"],
    servingGrams: 150,
    per100: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0, sodiumMg: 74, potassiumMg: 256, zincMg: 1, vitaminB12Ug: 0.3 },
  },
  {
    key: "salmon",
    name: "Salmon",
    aliases: ["salmon"],
    servingGrams: 150,
    per100: { calories: 206, proteinG: 22, carbsG: 0, fatG: 13, fiberG: 0, potassiumMg: 384, vitaminB12Ug: 3.2, vitaminDUg: 13, omega3G: 2.3 },
  },
  {
    key: "egg",
    name: "Egg",
    aliases: ["egg", "eggs"],
    servingGrams: 50,
    per100: { calories: 143, proteinG: 13, carbsG: 1.1, fatG: 9.5, fiberG: 0, sodiumMg: 142, calciumMg: 56, ironMg: 1.8, vitaminAUg: 160, vitaminB12Ug: 1.1, vitaminDUg: 2 },
  },
  {
    key: "white-rice",
    name: "White rice (cooked)",
    aliases: ["rice", "white rice"],
    servingGrams: 158,
    per100: { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4, magnesiumMg: 12 },
  },
  {
    key: "oats",
    name: "Oats (dry)",
    aliases: ["oats", "oatmeal"],
    servingGrams: 40,
    per100: { calories: 389, proteinG: 17, carbsG: 66, fatG: 7, fiberG: 10, magnesiumMg: 177, ironMg: 4.7, zincMg: 4, potassiumMg: 429 },
  },
  {
    key: "broccoli",
    name: "Broccoli",
    aliases: ["broccoli"],
    servingGrams: 90,
    per100: { calories: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, fiberG: 2.6, vitaminCMg: 89, vitaminKUg: 102, potassiumMg: 316, calciumMg: 47 },
  },
  {
    key: "spinach",
    name: "Spinach",
    aliases: ["spinach"],
    servingGrams: 60,
    per100: { calories: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2, ironMg: 2.7, vitaminKUg: 483, folateUg: 194, vitaminAUg: 469, potassiumMg: 558, magnesiumMg: 79 },
  },
  {
    key: "banana",
    name: "Banana",
    aliases: ["banana"],
    servingGrams: 118,
    per100: { calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, fiberG: 2.6, potassiumMg: 358, vitaminCMg: 8.7, magnesiumMg: 27 },
  },
  {
    key: "apple",
    name: "Apple",
    aliases: ["apple"],
    servingGrams: 182,
    per100: { calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, fiberG: 2.4, potassiumMg: 107, vitaminCMg: 4.6 },
  },
  {
    key: "almonds",
    name: "Almonds",
    aliases: ["almond", "almonds"],
    servingGrams: 28,
    per100: { calories: 579, proteinG: 21, carbsG: 22, fatG: 50, fiberG: 12.5, magnesiumMg: 270, calciumMg: 269, vitaminEMg: 25.6, ironMg: 3.7, zincMg: 3.1 },
  },
  {
    key: "greek-yogurt",
    name: "Greek yogurt (nonfat)",
    aliases: ["yogurt", "greek yogurt"],
    servingGrams: 170,
    per100: { calories: 59, proteinG: 10, carbsG: 3.6, fatG: 0.4, fiberG: 0, calciumMg: 110, vitaminB12Ug: 0.75, potassiumMg: 141 },
  },
  {
    key: "milk",
    name: "Milk (2%)",
    aliases: ["milk"],
    servingGrams: 244,
    per100: { calories: 50, proteinG: 3.4, carbsG: 4.8, fatG: 2, fiberG: 0, calciumMg: 120, vitaminDUg: 1.3, vitaminB12Ug: 0.5, potassiumMg: 150 },
  },
  {
    key: "ground-beef",
    name: "Ground beef (85/15)",
    aliases: ["beef", "ground beef", "burger"],
    servingGrams: 150,
    per100: { calories: 250, proteinG: 26, carbsG: 0, fatG: 15, fiberG: 0, ironMg: 2.7, zincMg: 6.3, vitaminB12Ug: 2.6 },
  },
  {
    key: "sweet-potato",
    name: "Sweet potato",
    aliases: ["sweet potato"],
    servingGrams: 130,
    per100: { calories: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, fiberG: 3, vitaminAUg: 709, potassiumMg: 337, vitaminCMg: 2.4 },
  },
  {
    key: "black-beans",
    name: "Black beans (cooked)",
    aliases: ["black beans", "beans"],
    servingGrams: 170,
    per100: { calories: 132, proteinG: 8.9, carbsG: 24, fatG: 0.5, fiberG: 8.7, ironMg: 2.1, magnesiumMg: 70, folateUg: 149, potassiumMg: 355 },
  },
  {
    key: "whole-wheat-bread",
    name: "Whole wheat bread",
    aliases: ["bread", "whole wheat bread", "toast"],
    servingGrams: 32,
    per100: { calories: 247, proteinG: 13, carbsG: 41, fatG: 3.4, fiberG: 7, ironMg: 2.5, magnesiumMg: 76 },
  },
  {
    key: "peanut-butter",
    name: "Peanut butter",
    aliases: ["peanut butter"],
    servingGrams: 32,
    per100: { calories: 588, proteinG: 25, carbsG: 20, fatG: 50, fiberG: 6, magnesiumMg: 154, vitaminEMg: 9, potassiumMg: 558 },
  },
  {
    key: "avocado",
    name: "Avocado",
    aliases: ["avocado"],
    servingGrams: 150,
    per100: { calories: 160, proteinG: 2, carbsG: 9, fatG: 15, fiberG: 7, potassiumMg: 485, vitaminKUg: 21, folateUg: 81 },
  },
  {
    key: "olive-oil",
    name: "Olive oil",
    aliases: ["olive oil", "oil"],
    servingGrams: 14,
    per100: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0, vitaminEMg: 14, vitaminKUg: 60 },
  },
  {
    key: "tuna",
    name: "Tuna (canned)",
    aliases: ["tuna"],
    servingGrams: 100,
    per100: { calories: 116, proteinG: 26, carbsG: 0, fatG: 0.8, fiberG: 0, vitaminB12Ug: 2.2, vitaminDUg: 2, omega3G: 0.3, sodiumMg: 247 },
  },
  {
    key: "cheddar",
    name: "Cheddar cheese",
    aliases: ["cheese", "cheddar"],
    servingGrams: 30,
    per100: { calories: 403, proteinG: 25, carbsG: 1.3, fatG: 33, fiberG: 0, calciumMg: 721, vitaminB12Ug: 1.1, vitaminAUg: 330, sodiumMg: 621 },
  },
  {
    key: "lentils",
    name: "Lentils (cooked)",
    aliases: ["lentil", "lentils"],
    servingGrams: 170,
    per100: { calories: 116, proteinG: 9, carbsG: 20, fatG: 0.4, fiberG: 7.9, ironMg: 3.3, folateUg: 181, magnesiumMg: 36, potassiumMg: 369 },
  },
  {
    key: "potato",
    name: "Potato",
    aliases: ["potato", "potatoes"],
    servingGrams: 150,
    per100: { calories: 87, proteinG: 1.9, carbsG: 20, fatG: 0.1, fiberG: 1.8, potassiumMg: 379, vitaminCMg: 13 },
  },
  {
    key: "orange",
    name: "Orange",
    aliases: ["orange"],
    servingGrams: 140,
    per100: { calories: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, fiberG: 2.4, vitaminCMg: 53, folateUg: 30, calciumMg: 40 },
  },
];

const BY_KEY = new Map(FOODS.map((f) => [f.key, f]));

export function foodByKey(key: string): Food | undefined {
  return BY_KEY.get(key);
}

/** Scale per-100g nutrients to a given gram amount. */
export function scaleNutrients(per100: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  const p = per100;
  const scale = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v * f * 100) / 100;
  return {
    calories: Math.round(p.calories * f),
    proteinG: Math.round(p.proteinG * f * 10) / 10,
    carbsG: Math.round(p.carbsG * f * 10) / 10,
    fatG: Math.round(p.fatG * f * 10) / 10,
    fiberG: Math.round(p.fiberG * f * 10) / 10,
    sodiumMg: scale(p.sodiumMg),
    potassiumMg: scale(p.potassiumMg),
    magnesiumMg: scale(p.magnesiumMg),
    calciumMg: scale(p.calciumMg),
    ironMg: scale(p.ironMg),
    zincMg: scale(p.zincMg),
    vitaminAUg: scale(p.vitaminAUg),
    vitaminB12Ug: scale(p.vitaminB12Ug),
    folateUg: scale(p.folateUg),
    vitaminCMg: scale(p.vitaminCMg),
    vitaminDUg: scale(p.vitaminDUg),
    vitaminEMg: scale(p.vitaminEMg),
    vitaminKUg: scale(p.vitaminKUg),
    omega3G: scale(p.omega3G),
  };
}

/** Scale a food's per-100g nutrients to a given gram amount. */
export function nutrientsForGrams(food: Food, grams: number): Nutrients {
  return scaleNutrients(food.per100, grams);
}
