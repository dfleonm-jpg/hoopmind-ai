/**
 * Anthropometry derivations (v4 Fase 6). Pure functions.
 * Ape index, femur-proportion classification, touch height / rim gap.
 */

const RIM_HEIGHT_CM = 305; // 10 ft

export interface AnthroInput {
  heightCm: number;
  wingspanCm?: number | null;
  standingReachCm?: number | null;
  inseamCm?: number | null;
  femurLengthCm?: number | null;
  verticalJumpCm?: number | null;
}

export type FemurClass = "LONG_FEMUR" | "BALANCED" | "SHORT_LEVER";

export interface AnthroResult {
  apeIndexCm: number | null; // wingspan - height
  apeLabel: string | null;
  femurClass: FemurClass | null;
  femurLabel: string | null;
  touchHeightCm: number | null; // standingReach + verticalJump
  rimGapCm: number | null; // rim - touchHeight (negative => can dunk-reach)
}

export function computeAnthro(input: AnthroInput): AnthroResult {
  const apeIndexCm =
    input.wingspanCm != null ? input.wingspanCm - input.heightCm : null;
  const apeLabel =
    apeIndexCm == null
      ? null
      : apeIndexCm >= 5
        ? `Ape Index +${apeIndexCm} cm · ventaja en defensa y rebote`
        : apeIndexCm <= -3
          ? `Ape Index ${apeIndexCm} cm · compensa con posicionamiento`
          : `Ape Index ${apeIndexCm >= 0 ? "+" : ""}${apeIndexCm} cm · proporción estándar`;

  // Femur proportion: femur length relative to height.
  let femurClass: FemurClass | null = null;
  let femurLabel: string | null = null;
  if (input.femurLengthCm != null && input.heightCm > 0) {
    const ratio = input.femurLengthCm / input.heightCm;
    if (ratio >= 0.27) {
      femurClass = "LONG_FEMUR";
      femurLabel = "Fémur largo · palanca larga en sentadilla";
    } else if (ratio <= 0.235) {
      femurClass = "SHORT_LEVER";
      femurLabel = "Palanca corta · torso más vertical en sentadilla";
    } else {
      femurClass = "BALANCED";
      femurLabel = "Proporción balanceada";
    }
  }

  const touchHeightCm =
    input.standingReachCm != null && input.verticalJumpCm != null
      ? input.standingReachCm + input.verticalJumpCm
      : null;
  const rimGapCm = touchHeightCm != null ? RIM_HEIGHT_CM - touchHeightCm : null;

  return { apeIndexCm, apeLabel, femurClass, femurLabel, touchHeightCm, rimGapCm };
}

export { RIM_HEIGHT_CM };
