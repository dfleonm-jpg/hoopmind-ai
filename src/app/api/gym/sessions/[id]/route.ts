import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { UpdateGymSessionInput } from "@/lib/validation/gym";
import { awardXp } from "@/lib/gamification/award";
import { XP_AWARDS } from "@/lib/gamification/xp";

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
    select: { id: true, endedAt: true, setLogs: { select: { isPr: true } } },
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

  // Award XP once, only when the session transitions to ended (v4 Fase 6).
  let award = null;
  if (parsed.data.endedAt && existing.endedAt == null) {
    const prs = existing.setLogs.filter((s) => s.isPr).length;
    const amount = XP_AWARDS.GYM_SESSION + prs * XP_AWARDS.GYM_PR;
    award = await awardXp(user.id, amount);
  }

  return NextResponse.json({ ...session, award });
}
