/**
 * Dynamic player archetype + unlockable badges derived from real stats (v2).
 * Pure functions reused by the stats API and the Scouting Card.
 */

export type ArchetypeId =
  | "PERIMETER_SNIPER"
  | "PAINT_FINISHER"
  | "THREE_X_THREE_SPECIALIST"
  | "COMPLETE_PLAYER";

export interface ArchetypeInput {
  /** Per-zone aggregates (made/attempted). */
  zones: { zone: string; made: number; attempted: number; pct: number }[];
  threePct: number; // make% from 3pt zones
  paintPct: number; // make% in paint/free_throw
  threeAttempts: number;
  paintAttempts: number;
  threeXThreeSessions: number;
  totalCompleted: number;
}

const THREE_ZONES = new Set([
  "left_corner_3",
  "left_wing_3",
  "top_key_3",
  "right_wing_3",
  "right_corner_3",
]);
const PAINT_ZONES = new Set(["paint", "free_throw"]);

export function splitZonePerf(
  zones: ArchetypeInput["zones"],
): { threePct: number; paintPct: number; threeAttempts: number; paintAttempts: number } {
  let tm = 0,
    ta = 0,
    pm = 0,
    pa = 0;
  for (const z of zones) {
    if (THREE_ZONES.has(z.zone)) {
      tm += z.made;
      ta += z.attempted;
    } else if (PAINT_ZONES.has(z.zone)) {
      pm += z.made;
      pa += z.attempted;
    }
  }
  return {
    threePct: ta > 0 ? tm / ta : 0,
    paintPct: pa > 0 ? pm / pa : 0,
    threeAttempts: ta,
    paintAttempts: pa,
  };
}

export function resolveArchetype(input: ArchetypeInput): {
  id: ArchetypeId;
  label: string;
} {
  const {
    threePct,
    paintPct,
    threeAttempts,
    paintAttempts,
    threeXThreeSessions,
    totalCompleted,
  } = input;

  // Enough data on both ranges with balanced output → complete player.
  const hasRange = threeAttempts >= 10 && paintAttempts >= 10;

  if (threeXThreeSessions >= 3 && threeXThreeSessions >= totalCompleted * 0.6) {
    return { id: "THREE_X_THREE_SPECIALIST", label: "Especialista 3x3" };
  }
  if (hasRange && Math.abs(threePct - paintPct) < 0.08) {
    return { id: "COMPLETE_PLAYER", label: "Jugador Completo" };
  }
  if (threeAttempts >= 10 && threePct >= paintPct) {
    return { id: "PERIMETER_SNIPER", label: "Francotirador de Perímetro" };
  }
  if (paintAttempts >= 6) {
    return { id: "PAINT_FINISHER", label: "Finalizador en Pintura" };
  }
  return { id: "COMPLETE_PLAYER", label: "Jugador Completo" };
}

export interface BadgeInput {
  totalCompleted: number;
  bestStreak: number;
  threeMade: number;
  threePct: number;
  threeAttempts: number;
  analysesCount: number;
  threeXThreeCompleted: number;
}

export interface Badge {
  id: string;
  label: string;
  unlocked: boolean;
}

/** Six unlockable badges. */
export function resolveBadges(input: BadgeInput): Badge[] {
  return [
    {
      id: "first_training",
      label: "Primer Entreno",
      unlocked: input.totalCompleted >= 1,
    },
    {
      id: "streak_7",
      label: "Racha 7 Días",
      unlocked: input.bestStreak >= 7,
    },
    {
      id: "hundred_threes",
      label: "100 Triples",
      unlocked: input.threeMade >= 100,
    },
    {
      id: "sniper_60",
      label: "Francotirador >60%",
      // Require a meaningful sample so it isn't trivially unlocked.
      unlocked: input.threeAttempts >= 20 && input.threePct > 0.6,
    },
    {
      id: "biomech_analyst",
      label: "Analista Biomecánico",
      unlocked: input.analysesCount >= 1,
    },
    {
      id: "king_3x3",
      label: "Rey del 3x3",
      unlocked: input.threeXThreeCompleted >= 5,
    },
  ];
}
