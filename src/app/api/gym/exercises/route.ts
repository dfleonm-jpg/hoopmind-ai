import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";
import { MUSCLE_GROUPS } from "@/lib/validation/gym";

type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const muscleParam = searchParams.get("muscle");
  const muscle = MUSCLE_GROUPS.includes(muscleParam as MuscleGroup)
    ? (muscleParam as MuscleGroup)
    : null;

  const exercises = await prisma.gymExercise.findMany({
    where: muscle ? { primaryMuscles: { has: muscle } } : {},
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ exercises });
}
