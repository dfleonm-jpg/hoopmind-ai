import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { TopHeader } from "@/components/nav/TopHeader";
import { NutritionWorkspace } from "@/components/nutrition/NutritionWorkspace";

export const instant = false;

export default async function NutritionPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopHeader title="Nutrition Intelligence" subtitle="Energía & macros" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-5">
        <NutritionWorkspace />
      </main>
    </>
  );
}
