import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { unauthorized } from "@/lib/api/respond";
import { searchFoods } from "@/lib/nutrition/food-source";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const result = await searchFoods(q);
  return NextResponse.json(result);
}
