import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, notFound, unauthorized } from "@/lib/api/respond";

const AnalysisInput = z.object({
  elbowAngle: z.number().min(0).max(360),
  kneeFlexion: z.number().min(0).max(360),
  releaseMs: z.number().int().min(0).max(600_000),
  confidence: z.number().min(0).max(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id: sessionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  const parsed = AnalysisInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Métricas inválidas.",
      400,
    );
  }

  // Session (if provided) must belong to the user.
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true },
  });
  if (!session) return notFound("Sesión no encontrada.");

  // Persist metrics only — never the video (Req. 6.7).
  const analysis = await prisma.shotAnalysis.create({
    data: { sessionId: session.id, ...parsed.data },
  });

  return NextResponse.json(analysis, { status: 201 });
}
