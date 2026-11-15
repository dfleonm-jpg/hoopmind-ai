import "server-only";

import { prisma } from "@/lib/db/prisma";
import { computeReadiness } from "@/lib/recovery/readiness";

/**
 * Builds a compact, factual snapshot of the user's real data for the AI Coach.
 * Only includes data that actually exists — the coach must never claim to have
 * analyzed data it doesn't have. Returns a plain-text context block.
 */
export async function buildCoachContext(userId: string): Promise<string> {
  const [profile, lastGym, foodTodayAgg, recovery, recentSessions, nutritionGoal] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.gymSession.findFirst({
        where: { userId },
        orderBy: { startedAt: "desc" },
        include: { setLogs: { include: { exercise: { select: { name: true } } } } },
      }),
      prisma.foodLog.findMany({
        where: {
          userId,
          loggedAt: { gte: startOfTodayUTC() },
        },
        select: { calories: true, proteinG: true },
      }),
      prisma.recoveryLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: "desc" },
      }),
      prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          status: true,
          startedAt: true,
          shotLogs: { select: { made: true, attempted: true, zone: true } },
        },
      }),
      prisma.nutritionGoal.findUnique({ where: { userId } }),
    ]);

  const lines: string[] = ["DATOS REALES DEL USUARIO (usa solo esto; no inventes):"];

  if (profile) {
    lines.push(
      `- Perfil: ${profile.heightCm} cm, ${profile.weightKg} kg, posición ${profile.position}, nivel ${profile.level}, formato ${profile.format}.` +
        (profile.age ? ` Edad ${profile.age}.` : "") +
        (profile.sex ? ` Sexo ${profile.sex}.` : ""),
    );
    lines.push(`- Objetivos: ${profile.goals.join(", ") || "sin especificar"}.`);
  } else {
    lines.push("- Perfil: aún no completado.");
  }

  if (lastGym) {
    const prs = lastGym.setLogs.filter((s) => s.isPr).length;
    lines.push(
      `- Última sesión de gym: "${lastGym.title}" con ${lastGym.setLogs.length} series registradas` +
        (prs > 0 ? `, ${prs} récord(s) personal(es)` : "") +
        ` (${timeAgo(lastGym.startedAt)}).`,
    );
  } else {
    lines.push("- Gym: sin sesiones registradas todavía.");
  }

  if (foodTodayAgg.length > 0) {
    const kcal = Math.round(foodTodayAgg.reduce((s, f) => s + f.calories, 0));
    const prot = Math.round(foodTodayAgg.reduce((s, f) => s + f.proteinG, 0));
    const target = nutritionGoal
      ? ` de un objetivo de ${nutritionGoal.calories} kcal / ${nutritionGoal.proteinG} g proteína`
      : "";
    lines.push(`- Nutrición hoy: ${kcal} kcal, ${prot} g proteína${target}.`);
  } else {
    lines.push("- Nutrición hoy: sin registros.");
  }

  if (recovery) {
    const r = computeReadiness(recovery);
    lines.push(
      `- Recuperación reciente: preparación ${r.score}/100 (${r.band}).` +
        (recovery.sleepHours != null ? ` Durmió ${recovery.sleepHours} h.` : "") +
        (r.overreachingFlag ? " Señales de fatiga acumulada." : ""),
    );
  } else {
    lines.push("- Recuperación: sin check-ins registrados.");
  }

  const totalMade = recentSessions.reduce(
    (s, x) => s + x.shotLogs.reduce((a, l) => a + l.made, 0),
    0,
  );
  const totalAtt = recentSessions.reduce(
    (s, x) => s + x.shotLogs.reduce((a, l) => a + l.attempted, 0),
    0,
  );
  if (totalAtt > 0) {
    lines.push(
      `- Baloncesto (últimas ${recentSessions.length} sesiones): ${totalMade}/${totalAtt} tiros (${Math.round(
        (totalMade / totalAtt) * 100,
      )}%).`,
    );
  } else {
    lines.push("- Baloncesto: sin tiros registrados recientemente.");
  }

  return lines.join("\n");
}

function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function timeAgo(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}
