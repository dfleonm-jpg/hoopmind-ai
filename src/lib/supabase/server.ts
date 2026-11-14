import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * In Next.js 16 `cookies()` is async, so this helper is async too.
 *
 * Server Components cannot write cookies; the `setAll` try/catch swallows that
 * case. Token refresh is handled in middleware (see `updateSession`).
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // Middleware refreshes the session cookie instead.
          }
        },
      },
    },
  );
}
