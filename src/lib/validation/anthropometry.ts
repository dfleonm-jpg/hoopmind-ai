import { z } from "zod";

/** Optional anthropometry measurements (v4 Fase 6). All nullable/optional. */
export const AnthropometryInput = z.object({
  wingspanCm: z.number().int().min(120).max(280).nullable().optional(),
  standingReachCm: z.number().int().min(150).max(320).nullable().optional(),
  inseamCm: z.number().int().min(50).max(120).nullable().optional(),
  femurLengthCm: z.number().int().min(30).max(70).nullable().optional(),
  verticalJumpCm: z.number().int().min(0).max(130).nullable().optional(),
});

export type AnthropometryInput = z.infer<typeof AnthropometryInput>;
