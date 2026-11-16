import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { ToggleHabitInput } from "@/lib/validation/wellness";

/** Toggle a habit's completion for a given day (idempotent create/delete). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: habitId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  const parsed = ToggleHabitInput.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", "Fecha inválida.", 400);
  }
  const { day } = parsed.data;

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    select: { id: true },
  });
  if (!habit) return notFound("Hábito no encontrado.");

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_day: { habitId, day } },
    select: { id: true },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ done: false });
  }

  await prisma.habitLog.create({
    data: { habitId, userId: user.id, day },
  });
  return NextResponse.json({ done: true });
}
