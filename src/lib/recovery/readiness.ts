/**
 * Training readiness from the latest recovery check-in (v4 Fase 3).
 * Pure function. Never diagnoses; recommends rest / lower intensity / pro eval.
 */

export interface ReadinessInput {
  sleepHours?: number | null;
  sleepQuality?: number | null; // 1–5
  fatigue?: number | null; // 1–5 (5 worst)
  soreness?: number | null; // 1–5 (5 worst)
  stress?: number | null; // 1–5 (5 worst)
  energy?: number | null; // 1–5 (5 best)
  mood?: number | null; // 1–5 (5 best)
}

export interface ReadinessResult {
  score: number; // 0–100
  band: "LOW" | "MODERATE" | "HIGH";
  recommendation: string;
  /** True when several negative signals cluster — suggest rest / pro eval. */
  overreachingFlag: boolean;
}

function norm5Positive(v: number | null | undefined): number | null {
  if (v == null) return null;
  return (v - 1) / 4; // 1->0, 5->1
}
function norm5Negative(v: number | null | undefined): number | null {
  if (v == null) return null;
  return 1 - (v - 1) / 4; // 1->1 (good), 5->0 (bad)
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const parts: number[] = [];

  // Sleep hours: ideal 7–9h.
  if (input.sleepHours != null) {
    const h = input.sleepHours;
    const sleepScore =
      h >= 7 && h <= 9 ? 1 : h >= 6 && h < 7 ? 0.7 : h < 6 ? Math.max(0, h / 6 * 0.6) : 0.8;
    parts.push(sleepScore);
  }
  const sq = norm5Positive(input.sleepQuality);
  if (sq != null) parts.push(sq);
  const fat = norm5Negative(input.fatigue);
  if (fat != null) parts.push(fat);
  const sore = norm5Negative(input.soreness);
  if (sore != null) parts.push(sore);
  const str = norm5Negative(input.stress);
  if (str != null) parts.push(str);
  const en = norm5Positive(input.energy);
  if (en != null) parts.push(en);
  const mo = norm5Positive(input.mood);
  if (mo != null) parts.push(mo);

  const score =
    parts.length > 0
      ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
      : 50;

  // Overreaching cluster: 2+ strong negative signals.
  let negativeSignals = 0;
  if ((input.fatigue ?? 0) >= 4) negativeSignals++;
  if ((input.soreness ?? 0) >= 4) negativeSignals++;
  if ((input.stress ?? 0) >= 4) negativeSignals++;
  if ((input.sleepHours ?? 8) < 5) negativeSignals++;
  if ((input.energy ?? 5) <= 2) negativeSignals++;
  const overreachingFlag = negativeSignals >= 2;

  let band: ReadinessResult["band"];
  let recommendation: string;
  if (overreachingFlag || score < 40) {
    band = "LOW";
    recommendation = overreachingFlag
      ? "Varias señales de fatiga coinciden hoy. Prioriza descanso o recuperación activa suave. Si la fatiga o el dolor persisten varios días, valora consultar a un profesional."
      : "Preparación baja: descansa o haz solo movilidad y recuperación activa.";
  } else if (score < 70) {
    band = "MODERATE";
    recommendation =
      "Preparación moderada: entrena a intensidad controlada y ajusta el volumen según cómo te sientas.";
  } else {
    band = "HIGH";
    recommendation =
      "Preparación alta: buen momento para una sesión exigente. Calienta bien antes de empezar.";
  }

  return { score, band, recommendation, overreachingFlag };
}
