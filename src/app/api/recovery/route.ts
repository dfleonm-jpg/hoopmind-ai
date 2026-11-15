import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { LogRecoveryInput } from "@/lib/validation/wellness";
import { computeReadiness } from "@/lib/recovery/readiness";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const latest = await prisma.recoveryLog.findFirst({
    where: { userId: user.id },
    orderBy: { loggedAt: "desc" },
  });
  const history = await prisma.recoveryLog.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: "desc" },
    take: 14,
    select: { loggedAt: true, sleepHours: true, fatigue: true, energy: true },
  });

  const readiness = latest ? computeReadiness(latest) : null;
  return NextResponse.json({ latest, readiness, history });
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

  const parsed = LogRecoveryInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const values = Object.values(parsed.data).filter((v) => v !== undefined);
  if (values.length === 0) {
    return apiError("VALIDATION", "Completa al menos un campo.", 400);
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const log = await prisma.recoveryLog.create({
    data: { userId: user.id, ...parsed.data },
  });
  const readiness = computeReadiness(log);

  return NextResponse.json({ log, readiness }, { status: 201 });
}
