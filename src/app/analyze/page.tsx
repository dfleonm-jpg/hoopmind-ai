import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { AnalyzeClient } from "@/app/analyze/analyze-client";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <span className="text-accent text-xs font-semibold tracking-widest uppercase">
            Analizador de tiro
          </span>
          <h1 className="text-fg text-2xl font-bold tracking-tight">
            Tu mecánica
          </h1>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" className="px-3">
            ‹ Volver
          </Button>
        </Link>
      </header>

      <AnalyzeClient sessionId={session} />
    </main>
  );
}
