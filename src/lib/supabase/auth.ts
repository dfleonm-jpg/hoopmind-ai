import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Returns the authenticated Supabase user, or null.
 * Uses `getUser()` (not `getSession()`) so the token is validated server-side.
 */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the current user's profile completion flag.
 * `null` means no authenticated user; otherwise `isComplete` reflects onboarding.
 */
export async function getProfileState(): Promise<
  { userId: string; isComplete: boolean } | null
> {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { isComplete: true },
  });

  return { userId: user.id, isComplete: profile?.isComplete ?? false };
}
