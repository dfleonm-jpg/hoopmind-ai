import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const cursor = searchParams.get("cursor");

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      scenario: true,
      durationMin: true,
      difficulty: true,
      createdAt: true,
    },
  });

  const hasMore = workouts.length > limit;
  const items = hasMore ? workouts.slice(0, limit) : workouts;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ workouts: items, nextCursor });
}
