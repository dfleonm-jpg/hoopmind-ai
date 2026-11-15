import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreatePlannerEventInput } from "@/lib/validation/planner";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromDate = from ? new Date(from) : new Date(Date.now() - 86_400_000);
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86_400_000);

  // User-created planner events.
  const events = await prisma.plannerEvent.findMany({
    where: { userId: user.id, day: { gte: dayKey(fromDate), lte: dayKey(toDate) } },
    orderBy: [{ day: "asc" }, { time: "asc" }],
  });

  // Auto-derived entries from real logged activity (read-only, not editable).
  const [gym, bball] = await Promise.all([
    prisma.gymSession.findMany({
      where: { userId: user.id, startedAt: { gte: fromDate, lte: toDate } },
      select: { id: true, title: true, startedAt: true },
    }),
    prisma.session.findMany({
      where: { userId: user.id, startedAt: { gte: fromDate, lte: toDate } },
      select: { id: true, startedAt: true, status: true },
    }),
  ]);

  const derived = [
    ...gym.map((g) => ({
      id: `gym:${g.id}`,
      title: g.title,
      category: "GYM" as const,
      day: dayKey(g.startedAt),
      time: null as string | null,
      done: true,
      derived: true,
    })),
    ...bball.map((b) => ({
      id: `bball:${b.id}`,
      title: "Sesión de baloncesto",
      category: "TRAINING" as const,
      day: dayKey(b.startedAt),
      time: null as string | null,
      done: b.status === "COMPLETED",
      derived: true,
    })),
  ];

  return NextResponse.json({
    events: events.map((e) => ({ ...e, derived: false })),
    derived,
  });
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
  const parsed = CreatePlannerEventInput.safeParse(body);
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

  const event = await prisma.plannerEvent.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      day: parsed.data.day,
      time: parsed.data.time ?? null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
