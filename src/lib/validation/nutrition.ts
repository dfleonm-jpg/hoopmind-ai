import { z } from "zod";

export const ObjectiveEnum = z.enum([
  "MUSCLE_GAIN",
  "MAINTENANCE",
  "PERFORMANCE",
  "RECOMPOSITION",
]);

export const SexEnum = z.enum(["MALE", "FEMALE"]);
export const ActivityEnum = z.enum([
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
]);
export const MealEnum = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

/** Compute/save nutrition goal. Age/sex/activity optional if already on profile. */
export const SaveNutritionGoalInput = z.object({
  objective: ObjectiveEnum,
  age: z.number().int().min(10).max(100).optional(),
  sex: SexEnum.optional(),
  activityLevel: ActivityEnum.optional(),
  // Optional manual overrides (if the user edits computed targets).
  overrides: z
    .object({
      calories: z.number().int().min(800).max(6000),
      proteinG: z.number().int().min(0).max(500),
      carbsG: z.number().int().min(0).max(1000),
      fatG: z.number().int().min(0).max(400),
      fiberG: z.number().int().min(0).max(120),
      waterMl: z.number().int().min(500).max(8000),
    })
    .optional(),
});

export const LogFoodInput = z.object({
  mealType: MealEnum,
  name: z.string().min(1).max(80),
  sourceRef: z.string().max(80).optional(),
  quantityG: z.number().min(1).max(5000),
  // Per-100g macros from the source; the server scales to quantity.
  per100g: z.object({
    calories: z.number().min(0).max(1000),
    proteinG: z.number().min(0).max(100),
    carbsG: z.number().min(0).max(100),
    fatG: z.number().min(0).max(100),
    fiberG: z.number().min(0).max(100).optional(),
  }),
});

export const LogHydrationInput = z.object({
  amountMl: z.number().int().min(50).max(3000),
});
