import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { LogHydrationInput } from "@/lib/validation/nutrition";

function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const from = startOfTodayUTC();
  const to = new Date(from.getTime() + 86_400_000);
  const logs = await prisma.hydrationLog.findMany({
    where: { userId: user.id, loggedAt: { gte: from, lt: to } },
    select: { amountMl: true },
  });
  const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
  return NextResponse.json({ totalMl });
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

  const parsed = LogHydrationInput.safeParse(body);
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

  await prisma.hydrationLog.create({
    data: { userId: user.id, amountMl: parsed.data.amountMl },
  });

  const from = startOfTodayUTC();
  const to = new Date(from.getTime() + 86_400_000);
  const logs = await prisma.hydrationLog.findMany({
    where: { userId: user.id, loggedAt: { gte: from, lt: to } },
    select: { amountMl: true },
  });
  const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
  return NextResponse.json({ totalMl }, { status: 201 });
}
