import "server-only";

import { prisma } from "@/lib/db/prisma";

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

/** Minimum attempts for a zone to count as a reliable weakness signal. */
const MIN_ATTEMPTS = 6;

export interface WeakZone {
  zone: string;
  label: string;
  made: number;
  attempted: number;
  pct: number; // 0..1
}

export interface PerformanceDiagnosis {
  hasHistory: boolean;
  recentSessions: number;
  completedSessions: number;
  weakZones: WeakZone[];
  overallPct: number;
  /** Heuristic fatigue flag from density of recent sessions. */
  fatigue: "fresh" | "steady" | "high";
  streakDays: number;
}

/**
 * Reads the user's last 5 sessions + accumulated ShotLog to diagnose the two
 * coldest zones and recent load/fatigue. Feeds the adaptive prompt (v2 Block 2).
 */
export async function getPerformanceDiagnosis(
  userId: string,
): Promise<PerformanceDiagnosis> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 5,
    select: {
      status: true,
      startedAt: true,
      shotLogs: { select: { zone: true, made: true, attempted: true } },
    },
  });

  if (sessions.length === 0) {
    return {
      hasHistory: false,
      recentSessions: 0,
      completedSessions: 0,
      weakZones: [],
      overallPct: 0,
      fatigue: "fresh",
      streakDays: 0,
    };
  }

  // Aggregate shots by zone across the recent sessions.
  const byZone = new Map<string, { made: number; attempted: number }>();
  for (const s of sessions) {
    for (const log of s.shotLogs) {
      const acc = byZone.get(log.zone) ?? { made: 0, attempted: 0 };
      acc.made += log.made;
      acc.attempted += log.attempted;
      byZone.set(log.zone, acc);
    }
  }

  const zoneStats: WeakZone[] = Array.from(byZone.entries())
    .filter(([, v]) => v.attempted >= MIN_ATTEMPTS)
    .map(([zone, v]) => ({
      zone,
      label: ZONE_LABELS[zone] ?? zone,
      made: v.made,
      attempted: v.attempted,
      pct: v.made / v.attempted,
    }))
    .sort((a, b) => a.pct - b.pct);

  const weakZones = zoneStats.slice(0, 2);

  const totalMade = Array.from(byZone.values()).reduce((s, v) => s + v.made, 0);
  const totalAtt = Array.from(byZone.values()).reduce(
    (s, v) => s + v.attempted,
    0,
  );
  const overallPct = totalAtt > 0 ? totalMade / totalAtt : 0;

  // Fatigue heuristic: how many of the last 5 sessions fall within 3 days.
  const now = Date.now();
  const recentDense = sessions.filter(
    (s) => now - s.startedAt.getTime() <= 3 * 86_400_000,
  ).length;
  const fatigue: PerformanceDiagnosis["fatigue"] =
    recentDense >= 4 ? "high" : recentDense >= 2 ? "steady" : "fresh";

  // Consecutive-day streak among completed sessions (from today/yesterday back).
  const completedDays = new Set(
    sessions
      .filter((s) => s.status === "COMPLETED")
      .map((s) => s.startedAt.toISOString().slice(0, 10)),
  );
  const streakDays = currentStreak(completedDays);

  return {
    hasHistory: true,
    recentSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === "COMPLETED").length,
    weakZones,
    overallPct,
    fatigue,
    streakDays,
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
