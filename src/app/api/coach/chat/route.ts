import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, badRequest, unauthorized } from "@/lib/api/respond";
import { buildCoachContext } from "@/lib/ai/coach-context";
import {
  generateCoachReply,
  type ChatTurn,
  type CoachSpecialty,
} from "@/lib/ai/coach";
import { AIProviderError } from "@/lib/ai/generate";

const ChatInput = z.object({
  specialty: z.enum([
    "BASKETBALL",
    "STRENGTH",
    "NUTRITION",
    "GLOWUP",
    "RECOVERY",
    "PERFORMANCE",
  ]),
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON inválido.");
  }
  const parsed = ChatInput.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Datos inválidos.",
      400,
    );
  }
  const { specialty, message } = parsed.data;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
    },
  });

  // Resolve or create the conversation (scoped to the user).
  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const existing = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: { id: true },
    });
    if (!existing) conversationId = null;
  }
  if (!conversationId) {
    const convo = await prisma.aiConversation.create({
      data: {
        userId: user.id,
        specialty: specialty as CoachSpecialty,
        title: message.slice(0, 48),
      },
      select: { id: true },
    });
    conversationId = convo.id;
  }

  // Persist the user's message.
  await prisma.aiMessage.create({
    data: { conversationId, role: "USER", content: message },
  });

  // Load history (cap to last 20 turns) + build the real-data context.
  const [history, context] = await Promise.all([
    prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, content: true },
    }),
    buildCoachContext(user.id),
  ]);

  let reply: string;
  try {
    reply = await generateCoachReply(
      specialty as CoachSpecialty,
      context,
      history as ChatTurn[],
    );
  } catch (err) {
    if (err instanceof AIProviderError) {
      return apiError(
        "AI_UNAVAILABLE",
        "El coach no está disponible ahora. Inténtalo de nuevo.",
        503,
      );
    }
    return apiError("INTERNAL", "Error inesperado.", 500);
  }

  await prisma.aiMessage.create({
    data: { conversationId, role: "ASSISTANT", content: reply },
  });
  await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ conversationId, reply });
}
