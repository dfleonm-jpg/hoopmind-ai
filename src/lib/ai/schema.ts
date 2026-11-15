import { z } from "zod";

/** Canonical five-phase block order (Req. 3.3). */
export const BLOCK_ORDER = [
  "WARMUP",
  "TECHNIQUE",
  "FINISHING",
  "CONDITIONING",
  "COOLDOWN",
] as const;

export const BlockTypeEnum = z.enum(BLOCK_ORDER);

/** Preloaded drill ids that can be demonstrated on the tactic board (Req. 3.9). */
export const DrillIdEnum = z.enum([
  "pick_and_roll",
  "dribble_drive_stepback",
  "catch_and_shoot_move",
  "give_and_go",
  "horns_set",
  "iso_cross_jab",
  "three_v_three_motion",
  "backdoor_cut",
]);

export const ExerciseSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(10).max(400),
  reps: z.string().max(40).describe("p. ej. '3x10', '5 min', '20 tiros'"),
  intensity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  // Nullable (not optional): Groq strict structured outputs require every key
  // present; use null when no preloaded drill applies.
  drillId: DrillIdEnum.nullable().describe(
    "id de drill precargado si aplica, si no null",
  ),
});

export const BlockSchema = z.object({
  type: BlockTypeEnum,
  durationMin: z.number().int().min(1).max(30),
  exercises: z.array(ExerciseSchema).min(1).max(6),
});

export const WorkoutSchema = z
  .object({
    title: z.string().min(3).max(80),
    summary: z.string().min(10).max(300),
    totalDurationMin: z.number().int().min(28).max(62),
    blocks: z.array(BlockSchema).length(5),
  })
  // Enforce the exact canonical order of the five phases (Req. 3.3).
  .refine(
    (w) => w.blocks.map((b) => b.type).join(",") === BLOCK_ORDER.join(","),
    { message: "Los bloques deben seguir el orden canónico de 5 fases." },
  )
  // Sum of block durations must match the declared total within tolerance.
  .refine(
    (w) =>
      Math.abs(
        w.blocks.reduce((sum, b) => sum + b.durationMin, 0) -
          w.totalDurationMin,
      ) <= 2,
    {
      message:
        "La suma de las duraciones de los bloques debe coincidir con totalDurationMin (±2 min).",
    },
  );

export type Workout = z.infer<typeof WorkoutSchema>;
export type WorkoutBlock = z.infer<typeof BlockSchema>;
export type WorkoutExercise = z.infer<typeof ExerciseSchema>;

/** Single-exercise schema for the on-court "swap exercise" feature (v2). */
export const SwapExerciseSchema = z.object({
  exercise: ExerciseSchema,
});
export type SwapExercise = z.infer<typeof SwapExerciseSchema>;

/** Input accepted by POST /api/generate-workout (Req. 3.1). */
export const GenerateWorkoutInput = z.object({
  durationMin: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  scenario: z.enum(["FULL_COURT", "HALF_COURT", "STREET", "GYM_NO_HOOP"]),
});

export type GenerateWorkoutInput = z.infer<typeof GenerateWorkoutInput>;
