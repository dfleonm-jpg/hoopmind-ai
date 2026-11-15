import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { notFound, unauthorized } from "@/lib/api/respond";

const BUCKET = "progress-photos";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await prisma.progressPhoto.findFirst({
    where: { id, userId: user.id },
    select: { id: true, storagePath: true },
  });
  if (!existing) return notFound("Foto no encontrada.");

  // Remove the storage object (best-effort) then the DB record.
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([existing.storagePath]).catch(() => null);
  await prisma.progressPhoto.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
