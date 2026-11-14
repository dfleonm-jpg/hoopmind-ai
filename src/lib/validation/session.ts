import { z } from "zod";

/** Zones used by the shot chart (design.md). */
export const ZONE_IDS = [
  "left_corner_3",
  "left_wing_3",
  "top_key_3",
  "right_wing_3",
  "right_corner_3",
  "left_mid",
  "center_mid",
  "right_mid",
  "paint",
  "free_throw",
] as const;

export const ZoneEnum = z.enum(ZONE_IDS);

/** POST /api/sessions */
export const CreateSessionInput = z.object({
  workoutId: z.string().uuid(),
});

/** PATCH /api/sessions/[id] — finalize or abandon (Req. 5.5). */
export const UpdateSessionInput = z.object({
  status: z.enum(["COMPLETED", "ABANDONED"]),
  realDurationS: z.number().int().min(0).max(86_400).optional(),
});

/** POST /api/sessions/[id]/shots — idempotent per session+exercise+zone. */
export const ShotLogInput = z.object({
  exerciseId: z.string().uuid().nullable().optional(),
  zone: ZoneEnum,
  made: z.number().int().min(0),
  attempted: z.number().int().min(0),
}).refine((s) => s.made <= s.attempted, {
  message: "Los tiros encestados no pueden superar los intentados.",
});
