import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { TopHeader } from "@/components/nav/TopHeader";
import { PlyoLab } from "@/components/plyo/PlyoLab";

export const instant = false;

export default async function PlyometricsPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { weightKg: true },
  });

  return (
    <>
      <TopHeader title="Pliometría" subtitle="Laboratorio de explosividad" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-5">
        <PlyoLab weightKg={profile?.weightKg ?? 75} />
      </main>
    </>
  );
}
