import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { UpdateGymSessionInput } from "@/lib/validation/gym";

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

  const parsed = UpdateGymSessionInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  const existing = await prisma.gymSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Sesión no encontrada.");

  const session = await prisma.gymSession.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.endedAt ? { endedAt: new Date() } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
    select: { id: true, endedAt: true, notes: true },
  });

  return NextResponse.json(session);
}
