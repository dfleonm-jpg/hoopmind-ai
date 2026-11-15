import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { CreateMeasurementInput } from "@/lib/validation/gym";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { measuredAt: "desc" },
    take: 60,
  });
  return NextResponse.json({ measurements });
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

  const parsed = CreateMeasurementInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }

  // At least one field required.
  const values = Object.values(parsed.data).filter(
    (v) => v !== undefined && v !== "",
  );
  if (values.length === 0) {
    return apiError("VALIDATION", "Introduce al menos una medida.", 400);
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const measurement = await prisma.bodyMeasurement.create({
    data: { userId: user.id, ...parsed.data },
  });

  return NextResponse.json(measurement, { status: 201 });
}
