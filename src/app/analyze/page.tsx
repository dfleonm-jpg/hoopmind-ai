import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { AnalyzeClient } from "@/app/analyze/analyze-client";
import { TopHeader } from "@/components/nav/TopHeader";

export const instant = false;

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  await connection();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { session } = await searchParams;

  return (
    <>
      <TopHeader title="Tu mecánica" subtitle="Analizador de tiro" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-5">
        <AnalyzeClient sessionId={session} />
      </main>
    </>
  );
}
