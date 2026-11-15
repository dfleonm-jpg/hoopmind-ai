import { z } from "zod";

export const PlannerCategoryEnum = z.enum([
  "TRAINING",
  "GYM",
  "NUTRITION",
  "RECOVERY",
  "PERSONAL",
]);

export const CreatePlannerEventInput = z.object({
  title: z.string().min(2).max(80),
  category: PlannerCategoryEnum.default("PERSONAL"),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const UpdatePlannerEventInput = z.object({
  done: z.boolean(),
});
