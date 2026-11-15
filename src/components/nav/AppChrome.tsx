"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";

/** Routes where the bottom navigation should NOT appear. */
const HIDE_ON = ["/", "/login", "/train"];

/** Renders the bottom navigation on app routes only. */
export function AppChrome() {
  const pathname = usePathname() ?? "/";
  const hide =
    HIDE_ON.includes(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/train");

  if (hide) return null;
  return <BottomNav />;
}
