import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreateCareRoutineInput } from "@/lib/validation/wellness";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const routines = await prisma.careRoutine.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ routines });
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

  const parsed = CreateCareRoutineInput.safeParse(body);
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

  const routine = await prisma.careRoutine.create({
    data: {
      userId: user.id,
      category: parsed.data.category,
      title: parsed.data.title,
      steps: parsed.data.steps,
      timeOfDay: parsed.data.timeOfDay ?? null,
    },
  });

  return NextResponse.json(routine, { status: 201 });
}
