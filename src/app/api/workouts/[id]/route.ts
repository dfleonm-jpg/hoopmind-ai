import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound, unauthorized } from "@/lib/api/respond";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const workout = await prisma.workout.findFirst({
    // Scope by userId so a user can never read another user's workout.
    where: { id, userId: user.id },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: {
          exercises: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!workout) return notFound("Rutina no encontrada.");

  return NextResponse.json({ workout });
}
