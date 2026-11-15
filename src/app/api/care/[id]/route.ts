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
  const existing = await prisma.careRoutine.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Rutina no encontrada.");

  await prisma.careRoutine.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
