import { z } from "zod";

const scale5 = z.number().int().min(1).max(5);

export const LogRecoveryInput = z.object({
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: scale5.optional(),
  fatigue: scale5.optional(),
  soreness: scale5.optional(),
  stress: scale5.optional(),
  energy: scale5.optional(),
  mood: scale5.optional(),
  notes: z.string().max(300).optional(),
});

export const CreateHabitInput = z.object({
  name: z.string().min(2).max(50),
  icon: z.string().max(4).optional(),
});

export const ToggleHabitInput = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const CareCategoryEnum = z.enum([
  "SKINCARE",
  "HAIRCARE",
  "GROOMING",
  "POSTURE",
]);

export const CreateCareRoutineInput = z.object({
  category: CareCategoryEnum,
  title: z.string().min(2).max(60),
  steps: z.array(z.string().min(1).max(120)).min(1).max(12),
  timeOfDay: z.enum(["AM", "PM"]).optional(),
});
