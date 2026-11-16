import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("id");

  // Single conversation with messages.
  if (conversationId) {
    const convo = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!convo) return NextResponse.json({ conversation: null });
    return NextResponse.json({ conversation: convo });
  }

  // List of conversations.
  const conversations = await prisma.aiConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      specialty: true,
      title: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ conversations });
}
