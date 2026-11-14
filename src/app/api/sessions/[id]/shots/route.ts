import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { ShotLogInput } from "@/lib/validation/session";

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

  const parsed = ShotLogInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const { exerciseId = null, zone, made, attempted } = parsed.data;

  // Session must belong to the user.
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });
  if (!session) return notFound("Sesión no encontrada.");

  // If an exercise is referenced, it must belong to this session's workout.
  if (exerciseId) {
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        block: { workout: { sessions: { some: { id: sessionId } } } },
      },
      select: { id: true },
    });
    if (!exercise) return notFound("Ejercicio no encontrado en la sesión.");
  }

  // Idempotent per (sessionId, exerciseId, zone): set absolute counts.
  let shotLog;
  if (exerciseId) {
    shotLog = await prisma.shotLog.upsert({
      where: {
        sessionId_exerciseId_zone: { sessionId, exerciseId, zone },
      },
      update: { made, attempted },
      create: { sessionId, exerciseId, zone, made, attempted },
    });
  } else {
    // Null exerciseId: Postgres treats NULLs as distinct in the unique index,
    // so upsert can't match reliably. Match manually on the null-exercise row.
    const found = await prisma.shotLog.findFirst({
      where: { sessionId, exerciseId: null, zone },
      select: { id: true },
    });
    shotLog = found
      ? await prisma.shotLog.update({
          where: { id: found.id },
          data: { made, attempted },
        })
      : await prisma.shotLog.create({
          data: { sessionId, exerciseId: null, zone, made, attempted },
        });
  }

  return NextResponse.json(shotLog, { status: 200 });
}
