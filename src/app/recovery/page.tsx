import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { TopHeader } from "@/components/nav/TopHeader";
import { RecoveryWorkspace } from "@/components/recovery/RecoveryWorkspace";

export const instant = false;

export default async function RecoveryPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopHeader title="Recovery" subtitle="Preparación & hábitos" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-5">
        <RecoveryWorkspace />
      </main>
    </>
  );
}
