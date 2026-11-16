import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { UpdatePlannerEventInput } from "@/lib/validation/planner";

export async function PATCH(
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
  const parsed = UpdatePlannerEventInput.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", "Datos inválidos.", 400);
  }

  const existing = await prisma.plannerEvent.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Evento no encontrado.");

  const event = await prisma.plannerEvent.update({
    where: { id: existing.id },
    data: { done: parsed.data.done },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.plannerEvent.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Evento no encontrado.");

  await prisma.plannerEvent.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
