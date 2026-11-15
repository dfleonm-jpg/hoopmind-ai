import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound, unauthorized } from "@/lib/api/respond";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  // Scope by userId so a user can only delete their own plays.
  const existing = await prisma.customPlay.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Jugada no encontrada.");

  await prisma.customPlay.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
