import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { ProfileInputSchema } from "@/lib/validation/profile";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "No autenticado." } },
    { status: 401 },
  );
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "JSON inválido." } },
      { status: 400 },
    );
  }

  const parsed = ProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: first?.message ?? "Datos de perfil inválidos.",
          field: first?.path.join(".") || undefined,
          issues: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Ensure the owning User row exists (the auth trigger normally creates it).
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? `${user.id}@placeholder.local` },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: { ...data, isComplete: true },
    create: { userId: user.id, ...data, isComplete: true },
  });

  return NextResponse.json({ profile });
}
