import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { GenerateWorkoutInput } from "@/lib/ai/schema";
import { buildWorkoutPrompt } from "@/lib/ai/prompt";
import { getPerformanceDiagnosis } from "@/lib/ai/performance";
import {
  AIProviderError,
  WorkoutValidationError,
  generateWorkout,
} from "@/lib/ai/generate";
import type { Goal } from "@prisma/client";

const GOAL_VALUES = [
  "SHOOTING",
  "BALL_HANDLING",
  "VERTICAL",
  "DEFENSE",
  "STRENGTH",
  "ENDURANCE",
  "SPEED",
  "WEIGHT_LOSS",
  "MUSCLE_GAIN",
  "MOBILITY",
  "IQ",
  "FINISHING",
] as const;

const IntakeInput = z.object({
  mainGoal: z.enum(GOAL_VALUES),
  secondaryGoals: z.array(z.enum(GOAL_VALUES)).max(5).default([]),
  scenario: z.enum(["FULL_COURT", "HALF_COURT", "GYM_NO_HOOP", "PHYSICAL_ONLY"]),
  durationMin: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(45),
    z.literal(60),
  ]),
  readiness: z.enum(["FRESH", "FATIGUED", "RECOVERY"]),
  injuries: z.array(z.string().max(30)).max(6).default([]),
});

const INJURY_ES: Record<string, string> = {
  knee: "rodilla",
  ankle: "tobillo",
  back: "espalda baja",
  shoulder: "hombro",
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  const parsed = IntakeInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const intake = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    return apiError(
      "PROFILE_REQUIRED",
      "Completa tu perfil básico antes de la encuesta.",
      400,
    );
  }

  // Merge goals from the intake (main first), dedup, cap at 6.
  const mergedGoals = Array.from(
    new Set<Goal>([
      intake.mainGoal as Goal,
      ...(intake.secondaryGoals as Goal[]),
      ...profile.goals,
    ]),
  ).slice(0, 6);

  await prisma.profile.update({
    where: { userId: user.id },
    data: { goals: mergedGoals },
  });

  const freshProfile = { ...profile, goals: mergedGoals };

  // Build the generation input and prompt (reuse the same engine).
  const genInput = GenerateWorkoutInput.parse({
    durationMin: intake.durationMin,
    scenario: intake.scenario,
    readiness: intake.readiness,
    includePhysical: intake.scenario === "PHYSICAL_ONLY",
  });

  const diagnosis = await getPerformanceDiagnosis(user.id);
  let prompt = buildWorkoutPrompt(
    freshProfile,
    genInput,
    3,
    diagnosis,
    intake.scenario === "PHYSICAL_ONLY",
  );

  // Injury safety: steer the AI away from aggravating movements.
  if (intake.injuries.length > 0) {
    const list = intake.injuries.map((i) => INJURY_ES[i] ?? i).join(", ");
    prompt +=
      `\n\nLesiones/molestias a cuidar: ${list}. ` +
      "Evita ejercicios que carguen esas zonas; ofrece alternativas de bajo impacto y recuerda que esto no sustituye una valoración médica profesional.";
  }

  let workout;
  try {
    workout = await generateWorkout(prompt);
  } catch (err) {
    if (err instanceof WorkoutValidationError) {
      return apiError("AI_INVALID_OUTPUT", "La IA no produjo una rutina válida. Inténtalo de nuevo.", 422);
    }
    if (err instanceof AIProviderError) {
      return apiError("AI_UNAVAILABLE", "El servicio de IA no está disponible.", 503);
    }
    return apiError("INTERNAL", "Error inesperado.", 500);
  }

  const storedScenario =
    intake.scenario === "PHYSICAL_ONLY" ? "GYM_NO_HOOP" : intake.scenario;

  const created = await prisma.workout.create({
    data: {
      userId: user.id,
      title: workout.title,
      scenario: storedScenario,
      format: profile.format,
      durationMin: intake.durationMin,
      difficulty: 3,
      content: workout,
      blocks: {
        create: workout.blocks.map((block, bi) => ({
          type: block.type,
          order: bi,
          durationMin: block.durationMin,
          exercises: {
            create: block.exercises.map((ex, ei) => ({
              order: ei,
              name: ex.name,
              description: ex.description,
              reps: ex.reps,
              drillId: ex.drillId,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ workoutId: created.id }, { status: 200 });
}
