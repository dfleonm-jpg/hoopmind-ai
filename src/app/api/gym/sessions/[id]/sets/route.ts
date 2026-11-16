import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { LogSetInput } from "@/lib/validation/gym";

/** Epley estimated 1RM. */
function est1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: sessionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = LogSetInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const { exerciseId, setNumber, weightKg, reps, rpe } = parsed.data;

  // Session must belong to the user.
  const session = await prisma.gymSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });
  if (!session) return notFound("Sesión no encontrada.");

  // Exercise must exist in the catalog.
  const exercise = await prisma.gymExercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });
  if (!exercise) return notFound("Ejercicio no encontrado.");

  // Real PR: compare estimated 1RM against the user's best for this exercise.
  const prevBest = await prisma.gymSetLog.findMany({
    where: {
      exerciseId,
      session: { userId: user.id },
    },
    select: { weightKg: true, reps: true },
  });
  const prevBest1RM = prevBest.reduce(
    (max, s) => Math.max(max, est1RM(s.weightKg, s.reps)),
    0,
  );
  const this1RM = est1RM(weightKg, reps);
  const isPr = this1RM > prevBest1RM && prevBest.length >= 0 && weightKg > 0;

  const setLog = await prisma.gymSetLog.create({
    data: {
      sessionId,
      exerciseId,
      setNumber,
      weightKg,
      reps,
      rpe: rpe ?? null,
      isPr,
    },
  });

  return NextResponse.json(
    { ...setLog, estimated1RM: Math.round(this1RM * 10) / 10, isPr },
    { status: 201 },
  );
}
