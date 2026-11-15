import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreateGymSessionInput } from "@/lib/validation/gym";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const sessions = await prisma.gymSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      setLogs: {
        include: { exercise: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json({ sessions });
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

  const parsed = CreateGymSessionInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const session = await prisma.gymSession.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      focus: parsed.data.focus,
    },
    select: { id: true, title: true, focus: true, startedAt: true },
  });

  return NextResponse.json(session, { status: 201 });
}
