import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { connection } from "next/server";
import { signOut } from "@/app/(auth)/login/actions";

// Auth-gated page: fully dynamic (reads per-request cookies), so block
// prerendering rather than stream a shell. Required under cacheComponents.
export const instant = false;

export default async function DashboardPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      durationMin: true,
      scenario: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-accent text-xs font-semibold tracking-widest uppercase">
            HoopMind AI
          </span>
          <h1 className="text-fg text-2xl font-bold tracking-tight">
            Tu cancha
          </h1>
        </div>
        <form action={signOut}>
          <Button variant="ghost" type="submit">
            Salir
          </Button>
        </form>
      </header>

      <Card className="flex flex-col gap-3">
        <CardTitle>Perfil</CardTitle>
        <CardDescription>
          {profile
            ? `Posición: ${profile.position} · Formato: ${profile.format} · Nivel: ${profile.level}`
            : "Aún no has completado tu perfil."}
        </CardDescription>
        <Link href="/onboarding" className="w-full">
          <Button variant="secondary" className="w-full">
            Editar perfil
          </Button>
        </Link>
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitle>Tus rutinas</CardTitle>
        {workouts.length === 0 ? (
          <CardDescription>
            Aún no has generado rutinas. El generador con IA llega en la próxima
            fase.
          </CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link href={`/train/${w.id}`} className="block">
                  <div className="border-border hover:border-accent flex items-center justify-between rounded-xl border px-3 py-3 transition-colors">
                    <div className="min-w-0">
                      <p className="text-fg truncate font-medium">{w.title}</p>
                      <p className="text-fg-muted text-xs">
                        {w.durationMin} min · {w.scenario}
                      </p>
                    </div>
                    <span className="text-accent text-sm font-semibold">
                      Entrenar ›
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
