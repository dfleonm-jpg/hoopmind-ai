"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { SideNav } from "@/components/nav/SideNav";
import { CommandPalette } from "@/components/nav/CommandPalette";

/** Routes where app navigation should NOT appear. */
const HIDE_ON = ["/", "/login", "/train"];

/**
 * App navigation chrome: desktop sidebar (lg+) + mobile pill dock.
 * The sidebar offsets content on lg via a body padding utility applied below.
 */
export function AppChrome() {
  const pathname = usePathname() ?? "/";
  const hide =
    HIDE_ON.includes(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/train");

  if (hide) return null;
  return (
    <>
      <SideNav />
      <BottomNav />
      <CommandPalette />
    </>
  );
}
