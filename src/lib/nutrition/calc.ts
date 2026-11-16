/**
 * Nutrition energy + macro estimation (v4 Fase 2). Pure functions.
 * BMR via Mifflin-St Jeor; TDEE via activity multiplier; macros by objective.
 * Safety: no aggressive deficits; minors never get weight-loss deficits.
 */

export type BiologicalSex = "MALE" | "FEMALE";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";
export type NutritionObjective =
  | "MUSCLE_GAIN"
  | "MAINTENANCE"
  | "PERFORMANCE"
  | "RECOMPOSITION";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export interface CalcInput {
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  objective: NutritionObjective;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
  /** Safety note surfaced to the UI when guards change the plan. */
  note: string | null;
}

/** Mifflin-St Jeor BMR (kcal/day). */
export function bmrMifflin(input: {
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(base + (input.sex === "MALE" ? 5 : -161));
}

export function computeTargets(input: CalcInput): NutritionTargets {
  const isMinor = input.age < 18;
  const bmr = bmrMifflin(input);
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[input.activityLevel]);

  // Calorie adjustment by objective (kept moderate; no crash deficits).
  let calories = tdee;
  let note: string | null = null;
  switch (input.objective) {
    case "MUSCLE_GAIN":
      calories = Math.round(tdee * 1.1); // ~+10% surplus
      break;
    case "RECOMPOSITION":
      if (isMinor) {
        // Minors: no deficit — support growth at maintenance.
        calories = tdee;
        note =
          "Eres menor de edad: priorizamos el mantenimiento para apoyar tu crecimiento, no la pérdida de peso.";
      } else {
        calories = Math.round(tdee * 0.9); // mild -10% deficit, floor below
      }
      break;
    case "PERFORMANCE":
      calories = Math.round(tdee * 1.05);
      break;
    case "MAINTENANCE":
    default:
      calories = tdee;
  }

  // Hard floor: never recommend below a safe minimum.
  const floor = input.sex === "MALE" ? 1500 : 1200;
  if (calories < floor) {
    calories = floor;
    note =
      note ??
      "Ajustamos las calorías a un mínimo seguro. Para objetivos agresivos, consulta a un profesional.";
  }

  // Protein: 1.6–2.2 g/kg depending on objective (hypertrophy/recomp higher).
  const proteinPerKg =
    input.objective === "MUSCLE_GAIN" || input.objective === "RECOMPOSITION"
      ? 2.0
      : 1.8;
  const proteinG = Math.round(input.weightKg * proteinPerKg);

  // Fat: ~25% of calories (min 0.6 g/kg for hormonal health).
  const fatG = Math.max(
    Math.round((calories * 0.25) / 9),
    Math.round(input.weightKg * 0.6),
  );

  // Carbs: remaining calories.
  const remaining = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remaining / 4));

  // Fiber ~14g per 1000 kcal; water ~35 ml/kg.
  const fiberG = Math.round((calories / 1000) * 14);
  const waterMl = Math.round(input.weightKg * 35);

  return { bmr, tdee, calories, proteinG, carbsG, fatG, fiberG, waterMl, note };
}

/** Scale per-100g macros to a consumed quantity (grams). */
export function scaleMacros(
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG?: number },
  grams: number,
) {
  const f = grams / 100;
  return {
    calories: round1(per100g.calories * f),
    proteinG: round1(per100g.proteinG * f),
    carbsG: round1(per100g.carbsG * f),
    fatG: round1(per100g.fatG * f),
    fiberG: round1((per100g.fiberG ?? 0) * f),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
