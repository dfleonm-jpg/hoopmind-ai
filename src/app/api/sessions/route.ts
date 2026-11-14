import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { CreateSessionInput } from "@/lib/validation/session";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = CreateSessionInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  // The workout must belong to the user.
  const workout = await prisma.workout.findFirst({
    where: { id: parsed.data.workoutId, userId: user.id },
    select: { id: true },
  });
  if (!workout) return notFound("Rutina no encontrada.");

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      workoutId: workout.id,
      status: "IN_PROGRESS",
    },
    select: { id: true, status: true, startedAt: true, workoutId: true },
  });

  return NextResponse.json(session, { status: 201 });
}
