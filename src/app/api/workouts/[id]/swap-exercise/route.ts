import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { BLOCK_ORDER } from "@/lib/ai/schema";
import {
  AIProviderError,
  WorkoutValidationError,
  generateSwapExercise,
} from "@/lib/ai/generate";

const SwapInput = z.object({
  blockType: z.enum(BLOCK_ORDER),
  durationMin: z.number().int().min(1).max(30),
  currentExerciseName: z.string().min(1).max(120),
  // Why the player wants a swap: hoop busy, no ball, no space, too hard, etc.
  reason: z
    .enum(["hoop_busy", "no_ball", "no_space", "too_hard", "other"])
    .default("other"),
});

const REASON_ES: Record<string, string> = {
  hoop_busy: "el aro está ocupado",
  no_ball: "no tiene balón disponible",
  no_space: "no tiene espacio suficiente",
  too_hard: "el ejercicio es demasiado difícil",
  other: "quiere una variante",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = SwapInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const input = parsed.data;

  // Workout must belong to the user (keeps context like scenario/format).
  const workout = await prisma.workout.findFirst({
    where: { id, userId: user.id },
    select: { scenario: true, format: true, difficulty: true },
  });
  if (!workout) return notFound("Rutina no encontrada.");

  const noHoop =
    workout.scenario === "STREET" || workout.scenario === "GYM_NO_HOOP";

  const prompt = [
    "Devuelve UN solo ejercicio de reemplazo equivalente dentro de un entrenamiento de baloncesto.",
    `Bloque: ${input.blockType}. Duración objetivo del ejercicio: ~${input.durationMin} min.`,
    `Formato: ${workout.format}. Escenario: ${workout.scenario}.`,
    `Motivo del cambio: ${REASON_ES[input.reason]}.`,
    `Ejercicio actual a sustituir: "${input.currentExerciseName}".`,
    "El reemplazo debe entrenar una habilidad equivalente del mismo bloque, pero resolver el motivo del cambio.",
    noHoop
      ? "No hay aro: el ejercicio NO puede requerir canasta."
      : "Puede incluir tiro a canasta si es propio del bloque.",
    input.reason === "too_hard"
      ? "Baja ligeramente la dificultad respecto al original."
      : "Mantén una dificultad equivalente.",
    "Vincula 'drillId' solo si corresponde a un drill precargado; si no, null.",
  ].join("\n");

  try {
    const { exercise } = await generateSwapExercise(prompt);
    return NextResponse.json({ exercise }, { status: 200 });
  } catch (err) {
    if (err instanceof WorkoutValidationError) {
      return apiError(
        "AI_INVALID_OUTPUT",
        "La IA no produjo un ejercicio válido. Inténtalo de nuevo.",
        422,
      );
    }
    if (err instanceof AIProviderError) {
      return apiError(
        "AI_UNAVAILABLE",
        "El servicio de IA no está disponible. Inténtalo de nuevo.",
        503,
      );
    }
    return apiError("INTERNAL", "Error inesperado.", 500);
  }
}
