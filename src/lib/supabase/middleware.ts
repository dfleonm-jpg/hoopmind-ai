import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Routes reachable without a session. */
const PUBLIC_PATHS = ["/login", "/auth"];

/** Static/asset prefixes the middleware should ignore. */
function isIgnoredPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the Supabase auth cookie and enforces routing:
 * - no session  -> /login
 * - session, profile incomplete -> /onboarding
 * - session, profile complete   -> /dashboard (from /login or /)
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isIgnoredPath(pathname)) {
    return response;
  }

  // Unauthenticated: allow public paths, otherwise send to /login.
  if (!user) {
    if (isPublicPath(pathname)) return response;
    return redirectTo(request, "/login");
  }

  // Authenticated: resolve onboarding state from the Profile table.
  const { data: profile } = await supabase
    .from("Profile")
    .select("isComplete")
    .eq("userId", user.id)
    .maybeSingle();

  const isComplete = profile?.isComplete === true;

  // Keep an authenticated user away from the login page and the bare root.
  if (isPublicPath(pathname) || pathname === "/") {
    return redirectTo(request, isComplete ? "/dashboard" : "/onboarding");
  }

  // Gate the app behind onboarding.
  if (!isComplete && !pathname.startsWith("/onboarding")) {
    return redirectTo(request, "/onboarding");
  }
  if (isComplete && pathname.startsWith("/onboarding")) {
    return redirectTo(request, "/dashboard");
  }

  return response;
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}
