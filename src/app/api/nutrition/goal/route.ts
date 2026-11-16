import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { SaveNutritionGoalInput } from "@/lib/validation/nutrition";
import { computeTargets } from "@/lib/nutrition/calc";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const goal = await prisma.nutritionGoal.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({ goal });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = SaveNutritionGoalInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const input = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    return apiError("PROFILE_REQUIRED", "Completa tu perfil primero.", 400);
  }

  // Persist age/sex/activity onto the profile when provided (needed for calc).
  const age = input.age ?? profile.age ?? null;
  const sex = input.sex ?? profile.sex ?? null;
  const activityLevel = input.activityLevel ?? profile.activityLevel;

  if (!age || !sex) {
    return apiError(
      "MISSING_DATA",
      "Necesitamos tu edad y sexo biológico para calcular tus necesidades energéticas.",
      400,
    );
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: { age, sex, activityLevel },
  });

  // Compute targets (unless the user supplied manual overrides).
  const targets = input.overrides
    ? {
        ...input.overrides,
        note: null as string | null,
      }
    : computeTargets({
        age,
        sex,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel,
        objective: input.objective,
      });

  const goal = await prisma.nutritionGoal.upsert({
    where: { userId: user.id },
    update: {
      objective: input.objective,
      calories: Math.round(targets.calories),
      proteinG: Math.round(targets.proteinG),
      carbsG: Math.round(targets.carbsG),
      fatG: Math.round(targets.fatG),
      fiberG: Math.round(targets.fiberG),
      waterMl: Math.round(targets.waterMl),
    },
    create: {
      userId: user.id,
      objective: input.objective,
      calories: Math.round(targets.calories),
      proteinG: Math.round(targets.proteinG),
      carbsG: Math.round(targets.carbsG),
      fatG: Math.round(targets.fatG),
      fiberG: Math.round(targets.fiberG),
      waterMl: Math.round(targets.waterMl),
    },
  });

  return NextResponse.json({ goal, note: targets.note ?? null });
}
