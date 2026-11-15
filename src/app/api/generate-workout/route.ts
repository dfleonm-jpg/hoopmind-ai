import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { GenerateWorkoutInput } from "@/lib/ai/schema";
import { buildWorkoutPrompt } from "@/lib/ai/prompt";
import { getPerformanceDiagnosis } from "@/lib/ai/performance";
import {
  AIProviderError,
  WorkoutValidationError,
  generateWorkout,
} from "@/lib/ai/generate";

/** Map recent make% + completed sessions to a 1–5 difficulty. */
function suggestDifficulty(pct: number, completed: number): number {
  if (completed === 0) return 3;
  if (pct >= 0.6 && completed >= 3) return 5;
  if (pct >= 0.5) return 4;
  if (pct >= 0.35) return 3;
  return 2;
}

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
  // PHYSICAL_ONLY implies a physical emphasis and maps to a no-hoop stored scenario.
  const includePhysical =
    input.includePhysical === true || input.scenario === "PHYSICAL_ONLY";

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

  // Performance memory: diagnose cold zones + fatigue and derive difficulty.
  const diagnosis = await getPerformanceDiagnosis(user.id);
  const difficulty = suggestDifficulty(
    diagnosis.overallPct,
    diagnosis.completedSessions,
  );
  const prompt = buildWorkoutPrompt(
    profile,
    input,
    difficulty,
    diagnosis,
    includePhysical,
  );

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

  // PHYSICAL_ONLY isn't a DB enum value; store as GYM_NO_HOOP (no hoop needed).
  const storedScenario =
    input.scenario === "PHYSICAL_ONLY" ? "GYM_NO_HOOP" : input.scenario;

  // Persist Workout + normalized blocks/exercises; content keeps the full JSON.
  const created = await prisma.workout.create({
    data: {
      userId: user.id,
      title: workout.title,
      scenario: storedScenario,
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
