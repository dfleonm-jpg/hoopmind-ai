import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { visionModel } from "@/lib/ai/provider";
import { AIProviderError, WorkoutValidationError } from "@/lib/ai/generate";

/**
 * Camera calorie counter (v5). Uses a vision model to identify foods in a
 * photo and estimate portion + macros. These are ESTIMATES: the model returns
 * a per-item confidence and the UI always surfaces a disclaimer. We never
 * present the numbers as measured facts.
 */

export const MealPhotoItemSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(60)
    .describe("Nombre del alimento en español, conciso (p. ej. 'Pechuga de pollo a la plancha')."),
  estimatedQuantityG: z
    .number()
    .min(1)
    .max(3000)
    .describe("Cantidad estimada del alimento en gramos."),
  per100g: z
    .object({
      calories: z.number().min(0).max(1000),
      proteinG: z.number().min(0).max(100),
      carbsG: z.number().min(0).max(100),
      fatG: z.number().min(0).max(100),
      fiberG: z.number().min(0).max(100),
    })
    .describe("Macros por cada 100 g del alimento."),
  confidence: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .describe("Confianza de la identificación y estimación."),
});

export const MealPhotoSchema = z.object({
  isFood: z
    .boolean()
    .describe("true si la imagen contiene comida/bebida identificable."),
  items: z.array(MealPhotoItemSchema).max(12),
  note: z
    .string()
    .max(200)
    .nullable()
    .describe("Nota breve opcional (p. ej. si la foto es ambigua o falta escala)."),
});

export type MealPhoto = z.infer<typeof MealPhotoSchema>;
export type MealPhotoItem = z.infer<typeof MealPhotoItemSchema>;

const VISION_SYSTEM = [
  "Eres un nutricionista que estima comidas a partir de fotos.",
  "Identifica cada alimento o bebida visible y estima su cantidad en gramos",
  "usando referencias de tamaño (plato, cubiertos, mano) cuando sea posible.",
  "Para cada alimento aporta macros por 100 g realistas basados en valores",
  "nutricionales típicos. Si no hay comida, responde isFood=false con items vacío.",
  "Sé honesto con la incertidumbre: usa confidence LOW cuando la foto sea",
  "ambigua, no haya escala, o el plato esté parcialmente oculto.",
  "Nunca inventes precisión que no tienes. Responde SOLO con el esquema pedido.",
].join(" ");

const TIMEOUT_MS = 30_000;

/**
 * Estimate the foods and macros in a meal photo.
 * @param dataUrl A `data:image/...;base64,...` URL of the photo.
 */
export async function estimateMealFromPhoto(dataUrl: string): Promise<MealPhoto> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { object } = await generateObject({
      model: visionModel,
      schema: MealPhotoSchema,
      system: VISION_SYSTEM,
      abortSignal: controller.signal,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiza esta foto de comida y estima los alimentos y sus macros.",
            },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });
    return object;
  } catch (err) {
    if (isValidationError(err)) {
      throw new WorkoutValidationError(
        err instanceof Error ? err.message : "La IA no reconoció la foto.",
      );
    }
    throw new AIProviderError(
      err instanceof Error ? err.message : "Fallo del proveedor de visión.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function isValidationError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name;
  return (
    name === "AI_NoObjectGeneratedError" ||
    name === "NoObjectGeneratedError" ||
    name === "AI_TypeValidationError" ||
    name === "TypeValidationError" ||
    name === "AI_JSONParseError" ||
    name === "JSONParseError"
  );
}
