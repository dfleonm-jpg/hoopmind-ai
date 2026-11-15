import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";

/**
 * Automatic weekly report: real aggregates across modules for the last 7 days.
 * No AI, no invented numbers — pure counts from the user's own data.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [gymSessions, gymSets, foodLogs, recovery, bballSessions, habitLogs] =
    await Promise.all([
      prisma.gymSession.count({
        where: { userId: user.id, startedAt: { gte: weekAgo } },
      }),
      prisma.gymSetLog.findMany({
        where: { session: { userId: user.id }, createdAt: { gte: weekAgo } },
        select: { isPr: true, weightKg: true, reps: true },
      }),
      prisma.foodLog.findMany({
        where: { userId: user.id, loggedAt: { gte: weekAgo } },
        select: { calories: true, loggedAt: true },
      }),
      prisma.recoveryLog.findMany({
        where: { userId: user.id, loggedAt: { gte: weekAgo } },
        select: { sleepHours: true },
      }),
      prisma.session.findMany({
        where: { userId: user.id, startedAt: { gte: weekAgo } },
        select: {
          status: true,
          shotLogs: { select: { made: true, attempted: true } },
        },
      }),
      prisma.habitLog.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekAgo },
        },
      }),
    ]);

  const prs = gymSets.filter((s) => s.isPr).length;
  const totalVolume = Math.round(
    gymSets.reduce((s, x) => s + x.weightKg * x.reps, 0),
  );

  const daysWithFood = new Set(
    foodLogs.map((f) => f.loggedAt.toISOString().slice(0, 10)),
  ).size;

  const sleepValues = recovery
    .map((r) => r.sleepHours)
    .filter((v): v is number => v != null);
  const avgSleep =
    sleepValues.length > 0
      ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10
      : null;

  const bballMade = bballSessions.reduce(
    (s, x) => s + x.shotLogs.reduce((a, l) => a + l.made, 0),
    0,
  );
  const bballAtt = bballSessions.reduce(
    (s, x) => s + x.shotLogs.reduce((a, l) => a + l.attempted, 0),
    0,
  );
  const bballCompleted = bballSessions.filter((s) => s.status === "COMPLETED").length;

  // Derived highlights / focus points from the real numbers.
  const highlights: string[] = [];
  if (prs > 0) highlights.push(`${prs} récord(s) personal(es) en el gym`);
  if (bballMade > 0) highlights.push(`${bballMade} tiros encestados en cancha`);
  if (avgSleep != null && avgSleep >= 7)
    highlights.push(`buena media de sueño (${avgSleep} h)`);
  if (habitLogs > 0) highlights.push(`${habitLogs} hábitos completados`);

  const focus: string[] = [];
  if (gymSessions === 0) focus.push("Retoma el entrenamiento de fuerza esta semana.");
  if (daysWithFood < 3) focus.push("Registra tus comidas con más constancia.");
  if (avgSleep != null && avgSleep < 7)
    focus.push("Intenta dormir más: tu media está por debajo de 7 h.");
  if (bballAtt === 0) focus.push("Vuelve a registrar tiros para seguir tu progreso.");

  return NextResponse.json({
    rangeDays: 7,
    gym: { sessions: gymSessions, prs, totalVolume },
    nutrition: { daysLogged: daysWithFood },
    recovery: { avgSleep, checkIns: recovery.length },
    basketball: {
      sessionsCompleted: bballCompleted,
      made: bballMade,
      attempted: bballAtt,
      pct: bballAtt > 0 ? Math.round((bballMade / bballAtt) * 100) / 100 : 0,
    },
    habits: { completions: habitLogs },
    highlights,
    focus,
  });
}
