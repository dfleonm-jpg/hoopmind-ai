import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { TopHeader } from "@/components/nav/TopHeader";

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
    <>
      <TopHeader
        title="Tu cancha"
        action={
          <form action={signOut}>
            <Button variant="ghost" type="submit">
              Salir
            </Button>
          </form>
        }
      />
      <main className="mx-auto mb-bottomnav flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-5">
        <DashboardView workouts={workoutItems} />
      </main>
    </>
  );
}
