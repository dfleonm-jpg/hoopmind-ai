import { z } from "zod";

export const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "CORE",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
] as const;

export const MuscleGroupEnum = z.enum(MUSCLE_GROUPS);

export const CreateGymSessionInput = z.object({
  title: z.string().min(2).max(80),
  focus: z.array(MuscleGroupEnum).min(1).max(6),
});

export const UpdateGymSessionInput = z.object({
  endedAt: z.boolean().optional(), // true -> close session now
  notes: z.string().max(500).optional(),
});

export const LogSetInput = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(20),
  weightKg: z.number().min(0).max(600),
  reps: z.number().int().min(1).max(100),
  rpe: z.number().int().min(1).max(10).optional(),
});

export const CreateMeasurementInput = z.object({
  weightKg: z.number().min(20).max(400).optional(),
  bodyFatPct: z.number().min(2).max(70).optional(),
  chestCm: z.number().min(40).max(200).optional(),
  waistCm: z.number().min(40).max(200).optional(),
  hipsCm: z.number().min(40).max(200).optional(),
  armCm: z.number().min(15).max(80).optional(),
  thighCm: z.number().min(25).max(120).optional(),
  notes: z.string().max(300).optional(),
});
