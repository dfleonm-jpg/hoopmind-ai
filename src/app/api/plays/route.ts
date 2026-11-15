import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreatePlayInput } from "@/lib/validation/play";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const plays = await prisma.customPlay.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plays });
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

  const parsed = CreatePlayInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos de jugada inválidos.",
      400,
    );
  }
  const data = parsed.data;

  // Ensure the owning User row exists (auth trigger normally creates it).
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const play = await prisma.customPlay.create({
    data: {
      userId: user.id,
      name: data.name,
      format: data.format,
      category: data.category,
      steps: data.steps,
      keyCues: data.keyCues,
    },
  });

  return NextResponse.json(play, { status: 201 });
}
