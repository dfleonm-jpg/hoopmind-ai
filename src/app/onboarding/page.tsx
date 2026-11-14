import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { ProfileInputSchema, type ProfileInput } from "@/lib/validation/profile";
import { OnboardingWizard } from "@/app/onboarding/onboarding-wizard";

// Auth-gated page: fully dynamic (reads per-request cookies), so block
// prerendering rather than stream a shell. Required under cacheComponents.
export const instant = false;

export default async function OnboardingPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  // Preload existing values when editing (Req. 2.4). Parse to the input shape
  // so the wizard receives a clean, typed object (drops db-only fields).
  let initialProfile: ProfileInput | null = null;
  if (profile) {
    const parsed = ProfileInputSchema.safeParse({
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      position: profile.position,
      format: profile.format,
      handedness: profile.handedness,
      level: profile.level,
      goals: profile.goals,
    });
    if (parsed.success) initialProfile = parsed.data;
  }

  const isEdit = profile?.isComplete === true;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <span className="text-accent text-sm font-semibold tracking-widest uppercase">
          {isEdit ? "Editar perfil" : "Onboarding"}
        </span>
        <h1 className="text-fg text-2xl font-bold tracking-tight">
          {isEdit ? "Ajusta tu perfil" : "Cuéntanos sobre ti"}
        </h1>
        <p className="text-fg-muted text-sm">
          Usaremos estos datos para generar rutinas a tu medida.
        </p>
      </header>

      <OnboardingWizard initialProfile={initialProfile} isEdit={isEdit} />
    </main>
  );
}
