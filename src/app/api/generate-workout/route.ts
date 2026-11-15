import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { GenerateWorkoutInput } from "@/lib/ai/schema";
import { buildWorkoutPrompt } from "@/lib/ai/prompt";
import {
  AIProviderError,
  WorkoutValidationError,
  generateWorkout,
} from "@/lib/ai/generate";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  // 401
  const user = await getAuthUser();
  if (!user) return errorResponse("UNAUTHORIZED", "No autenticado.", 401);

  // 400 — input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "JSON inválido.", 400);
  }
  const parsed = GenerateWorkoutInput.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(
      "VALIDATION",
      first?.message ?? "Parámetros inválidos.",
      400,
    );
  }
  const input = parsed.data;

  // Profile is required to tailor the session.
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profile || !profile.isComplete) {
    return errorResponse(
      "PROFILE_INCOMPLETE",
      "Completa tu perfil antes de generar una rutina.",
      400,
    );
  }

  // Suggested difficulty drives the prompt; default 3 until stats adjust it.
  const difficulty = 3;
  const prompt = buildWorkoutPrompt(profile, input, difficulty);

  // Generate + validate (422 on invalid output, 503 on provider failure).
  let workout;
  try {
    workout = await generateWorkout(prompt);
  } catch (err) {
    if (err instanceof WorkoutValidationError) {
      return errorResponse(
        "AI_INVALID_OUTPUT",
        "La IA no produjo una rutina válida. Inténtalo de nuevo.",
        422,
      );
    }
    if (err instanceof AIProviderError) {
      return errorResponse(
        "AI_UNAVAILABLE",
        "El servicio de IA no está disponible. Inténtalo de nuevo.",
        503,
      );
    }
    return errorResponse("INTERNAL", "Error inesperado.", 500);
  }

  // Enforce the requested-time tolerance (±2 min) against the request (Req. 3.4).
  if (Math.abs(workout.totalDurationMin - input.durationMin) > 2) {
    return errorResponse(
      "AI_INVALID_OUTPUT",
      "La duración generada no coincide con el tiempo solicitado.",
      422,
    );
  }

  // Persist Workout + normalized blocks/exercises; content keeps the full JSON.
  const created = await prisma.workout.create({
    data: {
      userId: user.id,
      title: workout.title,
      scenario: input.scenario,
      format: profile.format,
      durationMin: input.durationMin,
      difficulty,
      content: workout,
      blocks: {
        create: workout.blocks.map((block, blockIndex) => ({
          type: block.type,
          order: blockIndex,
          durationMin: block.durationMin,
          exercises: {
            create: block.exercises.map((ex, exIndex) => ({
              order: exIndex,
              name: ex.name,
              description: ex.description,
              reps: ex.reps,
              drillId: ex.drillId,
            })),
          },
        })),
      },
    },
    select: {
      id: true,
      title: true,
      scenario: true,
      durationMin: true,
      difficulty: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(created, { status: 200 });
}
