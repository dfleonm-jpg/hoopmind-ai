import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { AnthropometryInput } from "@/lib/validation/anthropometry";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      heightCm: true,
      wingspanCm: true,
      standingReachCm: true,
      inseamCm: true,
      femurLengthCm: true,
      verticalJumpCm: true,
    },
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = AnthropometryInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Medidas inválidas.",
      400,
    );
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return apiError("PROFILE_REQUIRED", "Completa tu perfil primero.", 400);
  }

  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: parsed.data,
    select: {
      heightCm: true,
      wingspanCm: true,
      standingReachCm: true,
      inseamCm: true,
      femurLengthCm: true,
      verticalJumpCm: true,
    },
  });

  return NextResponse.json({ profile });
}
