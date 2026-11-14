import "server-only";

import { generateObject } from "ai";
import { model } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { WorkoutSchema, type Workout } from "@/lib/ai/schema";

/** Distinguishes a validation failure (-> 422) from a provider failure (-> 503). */
export class WorkoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkoutValidationError";
  }
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}

const TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3; // 1 initial + up to 2 retries (Req. 3.6)

/**
 * Generate and validate a workout against WorkoutSchema.
 * - Retries on Zod validation failure up to MAX_ATTEMPTS.
 * - Throws WorkoutValidationError if still invalid, AIProviderError on provider/timeout.
 * The caller enforces the requested-time (±2 min) tolerance against the Workout.
 */
export async function generateWorkout(prompt: string): Promise<Workout> {
  let lastValidationError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const { object } = await generateObject({
        model,
        schema: WorkoutSchema,
        system: SYSTEM_PROMPT,
        prompt:
          attempt === 1
            ? prompt
            : `${prompt}\n\n(Intento ${attempt}: la respuesta anterior no cumplió el esquema. Respeta EXACTAMENTE el orden de 5 bloques y que la suma de duraciones = totalDurationMin.)`,
        abortSignal: controller.signal,
      });

      // generateObject already validates against the schema; return it.
      return object;
    } catch (err) {
      // The AI SDK throws a validation-shaped error (NoObjectGeneratedError /
      // TypeValidationError) when the model output fails the schema.
      if (isValidationError(err)) {
        lastValidationError = err;
        continue; // retry
      }
      // Timeout / network / provider error.
      throw new AIProviderError(
        err instanceof Error ? err.message : "Fallo del proveedor de IA.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new WorkoutValidationError(
    lastValidationError instanceof Error
      ? lastValidationError.message
      : "La IA no produjo una rutina válida tras varios intentos.",
  );
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
