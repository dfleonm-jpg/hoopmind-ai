import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";
import { ZONE_IDS } from "@/lib/validation/session";
import { levelProgress } from "@/lib/gamification/xp";
import {
  resolveArchetype,
  resolveBadges,
  splitZonePerf,
} from "@/lib/gamification/archetype";

type PlayFormat = "FIVE_V_FIVE" | "THREE_X_THREE";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const format = parseFormat(searchParams.get("format"));

  // Sessions scoped to the user, optional date/format filters.
  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      ...(from || to
        ? { startedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(format ? { workout: { is: { format } } } : {}),
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      shotLogs: { select: { zone: true, made: true, attempted: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Aggregate shots by zone.
  const byZone = new Map<string, { made: number; attempted: number }>();
  for (const z of ZONE_IDS) byZone.set(z, { made: 0, attempted: 0 });
  for (const s of sessions) {
    for (const log of s.shotLogs) {
      const acc = byZone.get(log.zone) ?? { made: 0, attempted: 0 };
      acc.made += log.made;
      acc.attempted += log.attempted;
      byZone.set(log.zone, acc);
    }
  }

  const zones = Array.from(byZone.entries()).map(([zone, v]) => ({
    zone,
    made: v.made,
    attempted: v.attempted,
    pct: v.attempted > 0 ? Math.round((v.made / v.attempted) * 100) / 100 : 0,
  }));

  // Streaks: consecutive days with >=1 COMPLETED session.
  const completedDays = new Set(
    sessions
      .filter((s) => s.status === "COMPLETED")
      .map((s) => dayKey(s.startedAt)),
  );
  const { current, best } = computeStreaks(completedDays);

  // Suggested difficulty from recent made% and completed sessions.
  const totalMade = zones.reduce((s, z) => s + z.made, 0);
  const totalAtt = zones.reduce((s, z) => s + z.attempted, 0);
  const overallPct = totalAtt > 0 ? totalMade / totalAtt : 0;
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  // --- Gamification (career-wide, not affected by UI filters) ---
  const gamification = await buildGamification(user.id, { current, best });

  return NextResponse.json({
    zones,
    streak: { current, best },
    suggestedDifficulty: suggestDifficulty(overallPct, completedCount),
    totals: { made: totalMade, attempted: totalAtt, pct: Math.round(overallPct * 100) / 100 },
    gamification,
  });
}

async function buildGamification(
  userId: string,
  streak: { current: number; best: number },
) {
  const [profile, allSessions, analysesCount] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { xp: true, gameLevel: true },
    }),
    prisma.session.findMany({
      where: { userId },
      select: {
        status: true,
        workout: { select: { format: true } },
        shotLogs: { select: { zone: true, made: true, attempted: true } },
      },
    }),
    prisma.shotAnalysis.count({ where: { session: { userId } } }),
  ]);

  // Career zone aggregates.
  const careerZones = new Map<string, { made: number; attempted: number }>();
  for (const z of ZONE_IDS) careerZones.set(z, { made: 0, attempted: 0 });
  for (const s of allSessions) {
    for (const log of s.shotLogs) {
      const acc = careerZones.get(log.zone) ?? { made: 0, attempted: 0 };
      acc.made += log.made;
      acc.attempted += log.attempted;
      careerZones.set(log.zone, acc);
    }
  }
  const zoneArr = Array.from(careerZones.entries()).map(([zone, v]) => ({
    zone,
    made: v.made,
    attempted: v.attempted,
    pct: v.attempted > 0 ? v.made / v.attempted : 0,
  }));

  const split = splitZonePerf(zoneArr);
  const totalCompleted = allSessions.filter((s) => s.status === "COMPLETED").length;
  const threeXThreeCompleted = allSessions.filter(
    (s) => s.status === "COMPLETED" && s.workout.format === "THREE_X_THREE",
  ).length;
  const threeMade = zoneArr
    .filter((z) => z.zone.endsWith("_3"))
    .reduce((s, z) => s + z.made, 0);

  const archetype = resolveArchetype({
    zones: zoneArr,
    ...split,
    threeXThreeSessions: threeXThreeCompleted,
    totalCompleted,
  });

  const badges = resolveBadges({
    totalCompleted,
    bestStreak: streak.best,
    threeMade,
    threePct: split.threePct,
    threeAttempts: split.threeAttempts,
    analysesCount,
    threeXThreeCompleted,
  });

  const xp = profile?.xp ?? 0;
  const progress = levelProgress(xp);

  return {
    xp,
    level: progress.level,
    levelProgressPct: Math.round(progress.pct * 100) / 100,
    xpIntoLevel: progress.intoLevel,
    xpForNext: progress.span,
    archetype,
    badges,
  };
}

function parseDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseFormat(v: string | null): PlayFormat | null {
  return v === "FIVE_V_FIVE" || v === "THREE_X_THREE" ? v : null;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function computeStreaks(days: Set<string>): { current: number; best: number } {
  if (days.size === 0) return { current: 0, best: 0 };
  const sorted = Array.from(days).sort(); // ascending
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const cur = new Date(sorted[i]!);
    const diffDays = Math.round(
      (cur.getTime() - prev.getTime()) / 86_400_000,
    );
    run = diffDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  // Current streak counts back from today (or yesterday).
  const todayKey = dayKey(new Date());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000));
  let anchor: string | null = days.has(todayKey)
    ? todayKey
    : days.has(yesterdayKey)
      ? yesterdayKey
      : null;
  let current = 0;
  while (anchor && days.has(anchor)) {
    current += 1;
    anchor = dayKey(new Date(new Date(anchor).getTime() - 86_400_000));
  }

  return { current, best };
}

function suggestDifficulty(pct: number, completed: number): number {
  let d = 3;
  if (completed === 0) return d;
  if (pct >= 0.6 && completed >= 3) d = 5;
  else if (pct >= 0.5) d = 4;
  else if (pct >= 0.35) d = 3;
  else d = 2;
  return Math.min(5, Math.max(1, d));
}
