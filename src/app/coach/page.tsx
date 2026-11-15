import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { TopHeader } from "@/components/nav/TopHeader";
import { CoachChat } from "@/components/coach/CoachChat";
import { WeeklyReport } from "@/components/coach/WeeklyReport";

export const instant = false;

export default async function CoachPage() {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <TopHeader title="AI Coach" subtitle="Tu cerebro de rendimiento" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-5">
        <WeeklyReport />
        <CoachChat />
      </main>
    </>
  );
}
