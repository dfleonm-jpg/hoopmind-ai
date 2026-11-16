/**
 * Player OVR (60–99) and 4 attributes from real data (v3).
 * Pure functions reused by the stats API, ScoutingCard and Combine.
 */

export interface OvrInput {
  /** Overall make% across all zones, 0..1. */
  overallPct: number;
  /** 3pt make% 0..1 and attempts. */
  threePct: number;
  threeAttempts: number;
  /** 3x3 completed sessions. */
  threeXThreeCompleted: number;
  totalCompleted: number;
  /** Best streak of consecutive training days. */
  bestStreak: number;
  /** Average biomechanics confidence 0..1 (0 if none). */
  bioScore: number;
  bioCount: number;
  /** Best normalized Combine score 0..1 (0 if none). */
  bestCombinePct: number;
}

export interface OvrResult {
  ovr: number; // 60..99
  attributes: {
    SHT: number; // shooting
    "3X3": number; // 3x3 game
    CON: number; // consistency
    BIO: number; // biomechanics
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Map a 0..1 performance ratio to the 60..99 attribute scale. */
function toAttr(ratio: number): number {
  return Math.round(clamp(60 + ratio * 39, 60, 99));
}

export function computeOvr(input: OvrInput): OvrResult {
  // SHOOTING: overall make% blended with best combine score.
  const shtRatio = input.bestCombinePct
    ? input.overallPct * 0.6 + input.bestCombinePct * 0.4
    : input.overallPct;
  const SHT = toAttr(shtRatio);

  // 3X3: 3pt make% weighted, plus a bump for 3x3 experience.
  const threeExp = Math.min(1, input.threeXThreeCompleted / 10);
  const threeRatio =
    input.threeAttempts >= 10
      ? input.threePct * 0.7 + threeExp * 0.3
      : threeExp * 0.5;
  const THREE = toAttr(threeRatio);

  // CONSISTENCY: training volume + best streak.
  const volRatio = Math.min(1, input.totalCompleted / 20);
  const streakRatio = Math.min(1, input.bestStreak / 14);
  const CON = toAttr(volRatio * 0.5 + streakRatio * 0.5);

  // BIOMECHANICS: average capture confidence (needs at least one analysis).
  const BIO = input.bioCount > 0 ? toAttr(input.bioScore) : 60;

  const ovr = Math.round((SHT + THREE + CON + BIO) / 4);
  return {
    ovr: clamp(ovr, 60, 99),
    attributes: { SHT, "3X3": THREE, CON, BIO },
  };
}
