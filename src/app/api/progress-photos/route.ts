import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";

const BUCKET = "progress-photos";

const RecordPhotoInput = z.object({
  pose: z.enum(["FRONT", "SIDE", "BACK"]),
  // Path returned by the client upload; must live under the user's folder.
  storagePath: z.string().min(3).max(200),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const photos = await prisma.progressPhoto.findMany({
    where: { userId: user.id },
    orderBy: { takenAt: "desc" },
    take: 60,
  });

  // Generate short-lived signed URLs (bucket is private).
  const supabase = await createClient();
  const withUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(p.storagePath, 60 * 10);
      return {
        id: p.id,
        pose: p.pose,
        takenAt: p.takenAt,
        url: data?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json({ photos: withUrls });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  const parsed = RecordPhotoInput.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", "Datos inválidos.", 400);
  }

  // Enforce ownership: path must be under the user's own folder.
  if (!parsed.data.storagePath.startsWith(`${user.id}/`)) {
    return apiError("FORBIDDEN", "Ruta de archivo no permitida.", 403);
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const photo = await prisma.progressPhoto.create({
    data: {
      userId: user.id,
      pose: parsed.data.pose,
      storagePath: parsed.data.storagePath,
    },
    select: { id: true, pose: true, takenAt: true },
  });

  return NextResponse.json(photo, { status: 201 });
}
