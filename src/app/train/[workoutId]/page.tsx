import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { WorkoutSchema, type Workout } from "@/lib/ai/schema";
import { ActiveSession } from "@/components/training/ActiveSession";

export const instant = false;

export default async function TrainPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { workoutId } = await params;

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
    include: {
      blocks: {
        orderBy: { order: "asc" },
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!workout) notFound();

  // Validate the stored JSON content to get a typed Workout for the UI.
  const parsed = WorkoutSchema.safeParse(workout.content);
  const content: Workout | null = parsed.success ? parsed.data : null;

  // Map DB exercise ids (for ShotLog) onto the typed content, block+exercise order.
  const exerciseIds: string[][] = workout.blocks.map((b) =>
    b.exercises.map((e) => e.id),
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
      <ActiveSession
        workoutId={workout.id}
        title={workout.title}
        content={content}
        exerciseIds={exerciseIds}
      />
    </main>
  );
}
