import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreateHabitInput } from "@/lib/validation/wellness";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Current streak of consecutive days with a completion, from a day set. */
function streak(days: Set<string>): number {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  let anchor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  let n = 0;
  while (anchor && days.has(anchor)) {
    n++;
    anchor = dayKey(new Date(new Date(anchor).getTime() - 86_400_000));
  }
  return n;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const today = dayKey(new Date());
  const habits = await prisma.habit.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      logs: { select: { day: true }, orderBy: { day: "desc" }, take: 90 },
    },
  });

  const result = habits.map((h) => {
    const days = new Set(h.logs.map((l) => l.day));
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      doneToday: days.has(today),
      streak: streak(days),
    };
  });

  return NextResponse.json({ habits: result });
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

  const parsed = CreateHabitInput.safeParse(body);
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

  const habit = await prisma.habit.create({
    data: { userId: user.id, name: parsed.data.name, icon: parsed.data.icon ?? null },
  });

  return NextResponse.json(habit, { status: 201 });
}
