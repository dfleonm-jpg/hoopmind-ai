import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";
import { UpdateSessionInput } from "@/lib/validation/session";
import { generateSessionReport } from "@/lib/ai/report";
import { xpForSession, levelForXp } from "@/lib/gamification/xp";

const ZONE_LABELS: Record<string, string> = {
  left_corner_3: "esquina izquierda (triple)",
  left_wing_3: "ala izquierda (triple)",
  top_key_3: "frontal (triple)",
  right_wing_3: "ala derecha (triple)",
  right_corner_3: "esquina derecha (triple)",
  left_mid: "media distancia izquierda",
  center_mid: "media distancia central",
  right_mid: "media distancia derecha",
  paint: "zona / pintura",
  free_throw: "tiro libre",
};

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
      workoutId: true,
    },
  });

  // On completion: build the post-session report, award XP, recalc level (v2).
  let report: {
    summary: string;
    recommendations: string[];
    xpEarned: number;
    level: number;
  } | null = null;

  if (session.status === "COMPLETED") {
    report = await buildCompletionReport(user.id, session.id, session.workoutId);
  }

  return NextResponse.json({ ...session, report });
}

async function buildCompletionReport(
  userId: string,
  sessionId: string,
  workoutId: string,
) {
  // Today's shots for this session.
  const todayLogs = await prisma.shotLog.findMany({
    where: { sessionId },
    select: { zone: true, made: true, attempted: true },
  });
  const todayMade = todayLogs.reduce((s, l) => s + l.made, 0);
  const todayAttempted = todayLogs.reduce((s, l) => s + l.attempted, 0);
  const todayPct = todayAttempted > 0 ? todayMade / todayAttempted : 0;

  // Hot zone of the day (best pct with attempts).
  let hotZoneLabel: string | null = null;
  let bestPct = -1;
  for (const l of todayLogs) {
    if (l.attempted > 0) {
      const pct = l.made / l.attempted;
      if (pct > bestPct) {
        bestPct = pct;
        hotZoneLabel = ZONE_LABELS[l.zone] ?? l.zone;
      }
    }
  }

  // Historical average excluding this session.
  const histLogs = await prisma.shotLog.findMany({
    where: { session: { userId }, sessionId: { not: sessionId } },
    select: { made: true, attempted: true },
  });
  const histMade = histLogs.reduce((s, l) => s + l.made, 0);
  const histAttempted = histLogs.reduce((s, l) => s + l.attempted, 0);
  const historicalPct = histAttempted > 0 ? histMade / histAttempted : todayPct;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    select: { durationMin: true, format: true },
  });

  // Current streak (completed sessions by day, back from today/yesterday).
  const completed = await prisma.session.findMany({
    where: { userId, status: "COMPLETED" },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
    take: 60,
  });
  const days = new Set(
    completed.map((s) => s.startedAt.toISOString().slice(0, 10)),
  );
  const streakDays = currentStreak(days);

  const content = await generateSessionReport({
    todayMade,
    todayAttempted,
    todayPct,
    historicalPct,
    hotZoneLabel,
    durationMin: workout?.durationMin ?? 0,
    format: workout?.format ?? "FIVE_V_FIVE",
  });

  const xpEarned = xpForSession({ made: todayMade, streakDays });

  // Persist report (idempotent via unique sessionId) and bump profile XP/level.
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { xp: true },
  });
  const newXp = (profile?.xp ?? 0) + xpEarned;
  const newLevel = levelForXp(newXp);

  await prisma.$transaction([
    prisma.sessionReport.upsert({
      where: { sessionId },
      update: {
        summary: content.summary,
        recommendations: content.recommendations,
        xpEarned,
      },
      create: {
        sessionId,
        summary: content.summary,
        recommendations: content.recommendations,
        xpEarned,
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: { xp: newXp, gameLevel: newLevel },
    }),
  ]);

  return {
    summary: content.summary,
    recommendations: content.recommendations,
    xpEarned,
    level: newLevel,
  };
}

function currentStreak(days: Set<string>): number {
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const today = key(new Date());
  const yesterday = key(new Date(Date.now() - 86_400_000));
  let anchor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  let streak = 0;
  while (anchor && days.has(anchor)) {
    streak += 1;
    anchor = key(new Date(new Date(anchor).getTime() - 86_400_000));
  }
  return streak;
}
