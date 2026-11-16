import "server-only";

import { prisma } from "@/lib/db/prisma";
import { levelForXp } from "@/lib/gamification/xp";

/**
 * Awards XP to a user's profile and recalculates gameLevel (v4 Fase 6).
 * Safe no-op if the profile doesn't exist yet. Returns the new xp/level,
 * or null when no profile. Never awards for over-training (callers decide
 * what counts; here we only persist positive, legitimate activity).
 */
export async function awardXp(
  userId: string,
  amount: number,
): Promise<{ xp: number; level: number; leveledUp: boolean } | null> {
  if (amount <= 0) return null;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { xp: true, gameLevel: true },
  });
  if (!profile) return null;

  const newXp = profile.xp + amount;
  const newLevel = levelForXp(newXp);
  await prisma.profile.update({
    where: { userId },
    data: { xp: newXp, gameLevel: newLevel },
  });
  return { xp: newXp, level: newLevel, leveledUp: newLevel > profile.gameLevel };
}
