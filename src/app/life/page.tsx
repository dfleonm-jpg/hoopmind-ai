import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { TopHeader } from "@/components/nav/TopHeader";
import { LifeOsWorkspace } from "@/components/life/LifeOsWorkspace";

export const instant = false;

export default async function LifePage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopHeader title="Life OS" subtitle="Tu semana en un vistazo" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-5">
        <LifeOsWorkspace />
      </main>
    </>
  );
}
