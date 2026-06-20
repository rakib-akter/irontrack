import { getUserId } from "@/lib/auth";
import { ok, unauthorized, error } from "@/lib/http";
import type { Nutrients } from "@/lib/nutrition";

// Look up a product by barcode via OpenFoodFacts (free, no key). We proxy
// server-side to avoid CORS and to normalize OFF's messy per-100g units.

type OFFNutriments = Record<string, number | undefined>;

function num(n: OFFNutriments, key: string): number | undefined {
  const v = n[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

function mapNutriments(n: OFFNutriments): Nutrients {
  // OFF gives per-100g values; energy in kcal, macros in g, minerals in g.
  const gToMg = (g?: number) => (g === undefined ? undefined : Math.round(g * 1000 * 100) / 100);

  // Sodium: prefer sodium_100g (g); fall back to salt_100g / 2.5.
  const sodiumG = num(n, "sodium_100g") ?? (num(n, "salt_100g") !== undefined ? num(n, "salt_100g")! / 2.5 : undefined);

  return {
    calories: Math.round(num(n, "energy-kcal_100g") ?? 0),
    proteinG: num(n, "proteins_100g") ?? 0,
    carbsG: num(n, "carbohydrates_100g") ?? 0,
    fatG: num(n, "fat_100g") ?? 0,
    fiberG: num(n, "fiber_100g") ?? 0,
    sodiumMg: gToMg(sodiumG),
    potassiumMg: gToMg(num(n, "potassium_100g")),
    calciumMg: gToMg(num(n, "calcium_100g")),
    ironMg: gToMg(num(n, "iron_100g")),
    magnesiumMg: gToMg(num(n, "magnesium_100g")),
    zincMg: gToMg(num(n, "zinc_100g")),
    vitaminCMg: gToMg(num(n, "vitamin-c_100g")),
  };
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code || !/^\d{6,14}$/.test(code)) {
    return error("Enter a valid barcode (6-14 digits)", 400);
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,serving_quantity,nutriments`,
      { headers: { "User-Agent": "STRATUM/0.1 (nutrition app)" } },
    );
    if (!res.ok) return error("Lookup failed", 502);
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return ok({ found: false });
    }

    const p = data.product;
    const per100 = mapNutriments(p.nutriments ?? {});
    const servingGrams =
      typeof p.serving_quantity === "number" ? p.serving_quantity : null;

    return ok({
      found: true,
      code,
      name: p.product_name || "Unknown product",
      brand: p.brands || null,
      servingGrams,
      per100,
    });
  } catch {
    return error("Could not reach the food database", 502);
  }
}
