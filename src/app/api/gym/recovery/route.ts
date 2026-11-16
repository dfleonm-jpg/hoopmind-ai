import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";
import { MUSCLE_GROUPS } from "@/lib/validation/gym";

type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
type RecoveryState = "FRESH" | "WORKED" | "FATIGUED";

const WINDOW_MS = 72 * 3_600_000; // muscles recover over ~72h

/**
 * Per-muscle fatigue from the last 72h of gym sets. Primary muscles take full
 * load, secondary half. Load decays linearly with time since the set.
 * Returns a 0..1 fatigue per muscle + a coarse state for the skeleton.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const since = new Date(Date.now() - WINDOW_MS);
  const sets = await prisma.gymSetLog.findMany({
    where: { session: { userId: user.id }, createdAt: { gte: since } },
    select: {
      createdAt: true,
      reps: true,
      weightKg: true,
      exercise: {
        select: { primaryMuscles: true, secondaryMuscles: true },
      },
    },
  });

  const load = new Map<MuscleGroup, number>();
  for (const g of MUSCLE_GROUPS) load.set(g, 0);

  const now = Date.now();
  for (const s of sets) {
    const ageMs = now - s.createdAt.getTime();
    const decay = Math.max(0, 1 - ageMs / WINDOW_MS); // 1 fresh -> 0 at 72h
    // Volume proxy: reps * sqrt(weight) keeps bodyweight work meaningful.
    const vol = s.reps * Math.sqrt(Math.max(1, s.weightKg));
    const contrib = vol * decay;
    for (const m of s.exercise.primaryMuscles as MuscleGroup[]) {
      load.set(m, (load.get(m) ?? 0) + contrib);
    }
    for (const m of s.exercise.secondaryMuscles as MuscleGroup[]) {
      load.set(m, (load.get(m) ?? 0) + contrib * 0.5);
    }
  }

  // Normalize against a reference load for a "hard session" per muscle.
  const REF = 600;
  const muscles = MUSCLE_GROUPS.map((m) => {
    const raw = load.get(m) ?? 0;
    const fatigue = Math.min(1, raw / REF);
    const state: RecoveryState =
      fatigue >= 0.6 ? "FATIGUED" : fatigue >= 0.2 ? "WORKED" : "FRESH";
    return { muscle: m, fatigue: Math.round(fatigue * 100) / 100, state };
  });

  return NextResponse.json({ muscles });
}
