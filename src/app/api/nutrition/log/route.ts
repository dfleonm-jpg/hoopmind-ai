import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { LogFoodInput } from "@/lib/validation/nutrition";
import { scaleMacros } from "@/lib/nutrition/calc";
import { awardXp } from "@/lib/gamification/award";
import { XP_AWARDS } from "@/lib/gamification/xp";

/** Start of the current day in UTC. */
function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const dayParam = searchParams.get("date");
  const from = dayParam ? new Date(dayParam) : startOfTodayUTC();
  const to = new Date(from.getTime() + 86_400_000);

  const logs = await prisma.foodLog.findMany({
    where: { userId: user.id, loggedAt: { gte: from, lt: to } },
    orderBy: { loggedAt: "asc" },
  });

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      proteinG: acc.proteinG + l.proteinG,
      carbsG: acc.carbsG + l.carbsG,
      fatG: acc.fatG + l.fatG,
      fiberG: acc.fiberG + l.fiberG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );

  return NextResponse.json({ logs, totals });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = LogFoodInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const input = parsed.data;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  // Award XP once per day on the first food logged (v4 Fase 6).
  const dayStart = startOfTodayUTC();
  const priorToday = await prisma.foodLog.count({
    where: { userId: user.id, loggedAt: { gte: dayStart } },
  });

  // Server scales per-100g macros to the consumed quantity (source of truth).
  const macros = scaleMacros(input.per100g, input.quantityG);

  const log = await prisma.foodLog.create({
    data: {
      userId: user.id,
      mealType: input.mealType,
      name: input.name,
      sourceRef: input.sourceRef ?? null,
      quantityG: input.quantityG,
      ...macros,
    },
  });

  let award = null;
  if (priorToday === 0) {
    award = await awardXp(user.id, XP_AWARDS.NUTRITION_DAY_LOGGED);
  }

  return NextResponse.json({ ...log, award }, { status: 201 });
}
