import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";

const CombineInput = z.object({
  testType: z.enum(["FIFTY_THREES", "HANDLE_FINISH", "CLUTCH_FT"]),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(1),
  durationS: z.number().int().min(0).max(86_400),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const results = await prisma.combineResult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ results });
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

  const parsed = CombineInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos de prueba inválidos.",
      400,
    );
  }
  const { testType, score, maxScore, durationS } = parsed.data;
  if (score > maxScore) {
    return apiError("VALIDATION", "score no puede superar maxScore.", 400);
  }

  // ovrDelta: small OVR contribution (0–5) scaled by the score ratio.
  const ratio = maxScore > 0 ? score / maxScore : 0;
  const ovrDelta = Math.round(ratio * 5);

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  const result = await prisma.combineResult.create({
    data: { userId: user.id, testType, score, maxScore, durationS, ovrDelta },
  });

  return NextResponse.json(result, { status: 201 });
}
