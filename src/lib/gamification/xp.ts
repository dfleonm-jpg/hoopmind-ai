/**
 * XP + level rules (v2). Pure functions, reusable on server and client.
 * XP is awarded per completed session; level derives from cumulative XP.
 */

export const XP_PER_COMPLETED_SESSION = 50;
export const XP_PER_MADE_SHOT = 2;
export const XP_STREAK_BONUS = 10; // per day of current streak, capped

/** XP earned for a single completed session. */
export function xpForSession({
  made,
  streakDays,
}: {
  made: number;
  streakDays: number;
}): number {
  const streakBonus = Math.min(streakDays, 7) * XP_STREAK_BONUS;
  return XP_PER_COMPLETED_SESSION + made * XP_PER_MADE_SHOT + streakBonus;
}

/** Cross-module XP awards (v4 Fase 6): unify XP across the ecosystem. */
export const XP_AWARDS = {
  GYM_SESSION: 40,
  GYM_PR: 15, // per personal record
  PLYO_SESSION: 35,
  RECOVERY_CHECKIN: 15,
  NUTRITION_DAY_LOGGED: 10,
} as const;

export type XpSource = keyof typeof XP_AWARDS;

/** Cumulative XP required to REACH a given level (level >= 1). */
export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  // Smooth quadratic curve: 200, 500, 900, 1400, ...
  const n = level - 1;
  return 100 * n * (n + 1);
}

/** Level reached for a cumulative XP amount. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpThresholdForLevel(level + 1)) level++;
  return level;
}

/** Progress within the current level, 0..1, plus the XP span. */
export function levelProgress(xp: number): {
  level: number;
  intoLevel: number;
  span: number;
  pct: number;
} {
  const level = levelForXp(xp);
  const base = xpThresholdForLevel(level);
  const next = xpThresholdForLevel(level + 1);
  const span = next - base;
  const intoLevel = xp - base;
  return {
    level,
    intoLevel,
    span,
    pct: span > 0 ? Math.min(1, intoLevel / span) : 1,
  };
}
