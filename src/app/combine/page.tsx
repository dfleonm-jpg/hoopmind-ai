import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { TopHeader } from "@/components/nav/TopHeader";
import { CombineClient } from "@/components/combine/CombineClient";

export const instant = false;

export default async function CombinePage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopHeader title="Combine" subtitle="Pruebas oficiales" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-5">
        <CombineClient />
      </main>
    </>
  );
}
