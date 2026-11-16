import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { estimateMealFromPhoto } from "@/lib/ai/vision";
import { AIProviderError, WorkoutValidationError } from "@/lib/ai/generate";
import { scaleMacros } from "@/lib/nutrition/calc";

/**
 * Camera calorie counter (v5): accept a meal photo (base64 data URL) and
 * return per-item macro ESTIMATES. The client lets the user review and log
 * each item via the existing /api/nutrition/log endpoint. We never auto-log
 * AI guesses, and the response is explicitly marked as an estimate.
 */

// ~6 MB of base64 (~4.5 MB binary). Groq vision accepts images well under this.
const MAX_DATA_URL_LEN = 6_000_000;

const PhotoInput = z.object({
  image: z
    .string()
    .min(32)
    .max(MAX_DATA_URL_LEN)
    .regex(
      /^data:image\/(jpeg|jpg|png|webp);base64,/,
      "La imagen debe ser un data URL JPEG, PNG o WebP.",
    ),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = PhotoInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Imagen inválida.",
      400,
    );
  }

  let result;
  try {
    result = await estimateMealFromPhoto(parsed.data.image);
  } catch (err) {
    if (err instanceof WorkoutValidationError) {
      return apiError(
        "AI_INVALID_OUTPUT",
        "No pudimos interpretar la foto. Prueba con mejor luz y encuadre.",
        422,
      );
    }
    if (err instanceof AIProviderError) {
      return apiError("AI_UNAVAILABLE", "El servicio de visión no está disponible.", 503);
    }
    return apiError("INTERNAL", "Error inesperado.", 500);
  }

  if (!result.isFood || result.items.length === 0) {
    return NextResponse.json({
      isFood: false,
      items: [],
      totalCalories: 0,
      note:
        result.note ??
        "No detectamos comida en la foto. Intenta con una imagen más clara del plato.",
      disclaimer:
        "Son estimaciones aproximadas generadas por IA, no mediciones exactas.",
    });
  }

  // Pre-compute scaled macros per item so the client can show totals and log directly.
  const items = result.items.map((it) => {
    const scaled = scaleMacros(it.per100g, it.estimatedQuantityG);
    return {
      name: it.name,
      quantityG: Math.round(it.estimatedQuantityG),
      per100g: it.per100g,
      scaled,
      confidence: it.confidence,
    };
  });

  const totalCalories = Math.round(
    items.reduce((sum, it) => sum + it.scaled.calories, 0),
  );

  return NextResponse.json({
    isFood: true,
    items,
    totalCalories,
    note: result.note,
    disclaimer:
      "Son estimaciones aproximadas generadas por IA, no mediciones exactas. Ajusta las cantidades si lo necesitas.",
  });
}
