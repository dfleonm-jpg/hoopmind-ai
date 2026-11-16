"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/** Routes without app chrome (no sidebar offset). */
const NO_CHROME = ["/", "/login", "/train"];

/**
 * Offsets page content to the right of the desktop sidebar on app routes.
 * Landing, login and the full-screen training view stay edge-to-edge.
 */
export function ContentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const noChrome =
    NO_CHROME.includes(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/train");

  return (
    <div className={noChrome ? "flex min-h-full flex-1 flex-col" : "flex min-h-full flex-1 flex-col lg:pl-60"}>
      {children}
    </div>
  );
}
