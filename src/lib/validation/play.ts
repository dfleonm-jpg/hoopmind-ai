import { z } from "zod";

/** Normalized point 0..1 over the court. */
const PointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const MoveSchema = z.object({
  entity: z.string().min(1).max(8),
  kind: z.enum(["run", "dribble", "pass", "shot", "screen"]),
  path: z.array(PointSchema).min(1).max(12),
  changeOfPace: z.boolean().optional(),
  durationMs: z.number().int().min(100).max(5000),
});

const StepSchema = z.object({
  label: z.string().min(1).max(160),
  moves: z.array(MoveSchema).max(10),
});

/** Payload for POST /api/plays. */
export const CreatePlayInput = z.object({
  name: z.string().min(2).max(60),
  format: z.enum(["FIVE_V_FIVE", "THREE_X_THREE"]),
  category: z.string().min(2).max(40),
  steps: z.array(StepSchema).min(1).max(12),
  keyCues: z.array(z.string().min(2).max(160)).max(6),
});

export type CreatePlayInput = z.infer<typeof CreatePlayInput>;
