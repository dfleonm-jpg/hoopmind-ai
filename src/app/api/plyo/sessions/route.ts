import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { awardXp } from "@/lib/gamification/award";
import { XP_AWARDS } from "@/lib/gamification/xp";

const CreatePlyoSession = z.object({
  drills: z.array(z.string().min(2).max(40)).min(1).max(8),
  totalContacts: z.number().int().min(1).max(400),
  durationS: z.number().int().min(10).max(14_400),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  const parsed = CreatePlyoSession.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const session = await prisma.plyoSession.create({
    data: {
      userId: user.id,
      drills: parsed.data.drills,
      totalContacts: parsed.data.totalContacts,
      durationS: parsed.data.durationS,
    },
    select: { id: true, totalContacts: true, durationS: true },
  });

  const award = await awardXp(user.id, XP_AWARDS.PLYO_SESSION);

  return NextResponse.json({ session, award }, { status: 201 });
}
