import "server-only";

/**
 * Food catalog adapter (v4 Fase 2). Prepared for a real external API.
 *
 * Provider is selected via FOOD_API_PROVIDER:
 *   - "off"  (Open Food Facts, keyless public API)
 *   - "usda" (USDA FoodData Central — requires USDA_FDC_API_KEY)
 *   - unset/other -> NOT configured; the UI shows a "requires configuration"
 *     state instead of inventing data (Req. #18 / #9).
 */

export interface FoodItem {
  sourceRef: string;
  name: string;
  /** Macros per 100 g. */
  per100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
}

export interface FoodSearchResult {
  configured: boolean;
  provider: string | null;
  items: FoodItem[];
}

const PROVIDER = process.env.FOOD_API_PROVIDER ?? "off";

export function isFoodSourceConfigured(): boolean {
  if (PROVIDER === "off") return true; // keyless public API
  if (PROVIDER === "usda") return Boolean(process.env.USDA_FDC_API_KEY);
  return false;
}

export async function searchFoods(query: string): Promise<FoodSearchResult> {
  const q = query.trim();
  if (!q) return { configured: isFoodSourceConfigured(), provider: PROVIDER, items: [] };

  if (!isFoodSourceConfigured()) {
    return { configured: false, provider: PROVIDER, items: [] };
  }

  try {
    if (PROVIDER === "usda") return await searchUsda(q);
    return await searchOpenFoodFacts(q);
  } catch {
    // Network/provider failure: report as configured but empty (caller handles).
    return { configured: true, provider: PROVIDER, items: [] };
  }
}

async function searchOpenFoodFacts(q: string): Promise<FoodSearchResult> {
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,nutriments&search_terms=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { "User-Agent": "HoopMind/1.0 (nutrition search)" },
    // Cache lightly to reduce load on the public API.
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`OFF ${res.status}`);
  const data = (await res.json()) as {
    products?: Array<{
      code?: string;
      product_name?: string;
      nutriments?: Record<string, number>;
    }>;
  };

  const items: FoodItem[] = (data.products ?? [])
    .filter((p) => p.product_name && p.nutriments)
    .map((p) => {
      const n = p.nutriments!;
      return {
        sourceRef: `off:${p.code ?? ""}`,
        name: p.product_name!.slice(0, 80),
        per100g: {
          calories: num(n["energy-kcal_100g"]),
          proteinG: num(n["proteins_100g"]),
          carbsG: num(n["carbohydrates_100g"]),
          fatG: num(n["fat_100g"]),
          fiberG: num(n["fiber_100g"]),
        },
      };
    })
    .filter((i) => i.per100g.calories > 0);

  return { configured: true, provider: "off", items };
}

async function searchUsda(q: string): Promise<FoodSearchResult> {
  const key = process.env.USDA_FDC_API_KEY!;
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?pageSize=15&api_key=${key}&query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = (await res.json()) as {
    foods?: Array<{
      fdcId?: number;
      description?: string;
      foodNutrients?: Array<{ nutrientName?: string; value?: number }>;
    }>;
  };

  const pick = (
    nutrients: Array<{ nutrientName?: string; value?: number }> | undefined,
    name: string,
  ) => num(nutrients?.find((x) => x.nutrientName?.includes(name))?.value);

  const items: FoodItem[] = (data.foods ?? [])
    .filter((f) => f.description)
    .map((f) => ({
      sourceRef: `usda:${f.fdcId ?? ""}`,
      name: f.description!.slice(0, 80),
      per100g: {
        calories: pick(f.foodNutrients, "Energy"),
        proteinG: pick(f.foodNutrients, "Protein"),
        carbsG: pick(f.foodNutrients, "Carbohydrate"),
        fatG: pick(f.foodNutrients, "Total lipid"),
        fiberG: pick(f.foodNutrients, "Fiber"),
      },
    }))
    .filter((i) => i.per100g.calories > 0);

  return { configured: true, provider: "usda", items };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}
