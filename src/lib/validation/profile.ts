import { z } from "zod";

// Domain enums — kept in sync with the Prisma schema (design.md).
export const PositionEnum = z.enum(["PG", "SG", "SF", "PF", "C"]);
export const PlayFormatEnum = z.enum(["FIVE_V_FIVE", "THREE_X_THREE"]);
export const HandednessEnum = z.enum(["LEFT", "RIGHT"]);
export const SkillLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);
export const GoalEnum = z.enum([
  "SHOOTING",
  "BALL_HANDLING",
  "VERTICAL",
  "DEFENSE",
]);

/** Payload accepted by PUT /api/profile (Req. 2.1, 2.2, 2.5). */
export const ProfileInputSchema = z.object({
  heightCm: z
    .number()
    .int()
    .min(120, "La altura debe ser al menos 120 cm.")
    .max(240, "La altura no puede superar 240 cm."),
  weightKg: z
    .number()
    .int()
    .min(30, "El peso debe ser al menos 30 kg.")
    .max(200, "El peso no puede superar 200 kg."),
  position: PositionEnum,
  format: PlayFormatEnum,
  handedness: HandednessEnum,
  level: SkillLevelEnum,
  goals: z
    .array(GoalEnum)
    .min(1, "Selecciona al menos un objetivo.")
    .max(4, "Puedes seleccionar como máximo cuatro objetivos.")
    .refine(
      (g) => new Set(g).size === g.length,
      "Los objetivos no pueden repetirse.",
    ),
});

export type ProfileInput = z.infer<typeof ProfileInputSchema>;
