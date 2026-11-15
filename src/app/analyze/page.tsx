import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db/prisma";
import { computeAnthro } from "@/lib/anthropometry/calc";
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

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { heightCm: true, femurLengthCm: true, wingspanCm: true },
  });
  const femurClass = profile
    ? computeAnthro({ heightCm: profile.heightCm, femurLengthCm: profile.femurLengthCm }).femurClass
    : null;

  return (
    <>
      <TopHeader title="Lab de técnica" subtitle="Tiro, gym y ball handling" />
      <main className="mx-auto mb-bottomnav flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-5">
        <AnalyzeClient sessionId={session} femurClass={femurClass} />
      </main>
    </>
  );
}
