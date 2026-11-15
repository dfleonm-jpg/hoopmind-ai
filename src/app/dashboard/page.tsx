import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const instant = false;

export default async function DashboardPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      durationMin: true,
      scenario: true,
      createdAt: true,
    },
  });

  const workoutItems = workouts.map((w) => ({
    id: w.id,
    title: w.title,
    durationMin: w.durationMin,
    scenario: w.scenario,
    createdAt: w.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6">
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

      <DashboardView workouts={workoutItems} />
    </main>
  );
}
