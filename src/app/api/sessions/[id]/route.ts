import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { UpdateSessionInput } from "@/lib/validation/session";

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

  const parsed = UpdateSessionInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  // Session must belong to the user and still be in progress.
  const existing = await prisma.session.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!existing) return notFound("Sesión no encontrada.");
  if (existing.status !== "IN_PROGRESS") {
    return apiError("INVALID_STATE", "La sesión ya está finalizada.", 409);
  }

  const session = await prisma.session.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      endedAt: new Date(),
      realDurationS: parsed.data.realDurationS ?? null,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      realDurationS: true,
    },
  });

  return NextResponse.json(session);
}
