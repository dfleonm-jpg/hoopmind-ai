"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface Item {
  href: string;
  label: string;
  icon: string;
  match: (p: string) => boolean;
}

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Inicio", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", match: (p) => p === "/dashboard" },
  { href: "/coach", label: "AI Coach", icon: "M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 21a7 7 0 0 1 14 0", match: (p) => p.startsWith("/coach") },
  { href: "/gym", label: "Gym", icon: "M6 7v10M18 7v10M6 12h12M3 9v6M21 9v6", match: (p) => p.startsWith("/gym") },
  { href: "/plyometrics", label: "Pliometría", icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z", match: (p) => p.startsWith("/plyometrics") },
  { href: "/plays", label: "Pizarra", icon: "M4 4h16v16H4zM4 9h16M9 9v11", match: (p) => p.startsWith("/plays") || p.startsWith("/train") },
  { href: "/analyze", label: "Lab técnica", icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z", match: (p) => p.startsWith("/analyze") },
  { href: "/combine", label: "Combine", icon: "M6 9V2h12v7a6 6 0 0 1-12 0zM6 22h12M9 18v4M15 18v4", match: (p) => p.startsWith("/combine") },
  { href: "/nutrition", label: "Nutrición", icon: "M6 2v7a3 3 0 0 0 6 0V2M9 9v13M16 2c-1.5 2-2 4-2 6s.5 4 2 4 2-2 2-4-.5-4-2-6z", match: (p) => p.startsWith("/nutrition") },
  { href: "/recovery", label: "Recovery", icon: "M22 12h-4l-3 9L9 3l-3 9H2", match: (p) => p.startsWith("/recovery") },
  { href: "/glowup", label: "Glow Up", icon: "M12 3v2M12 19v2M5 12H3M21 12h-2M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", match: (p) => p.startsWith("/glowup") },
  { href: "/life", label: "Life OS", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", match: (p) => p.startsWith("/life") },
  { href: "/onboarding", label: "Perfil", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", match: (p) => p.startsWith("/onboarding") },
];

/** Desktop sidebar (visible from lg breakpoint). Web-style navigation. */
export function SideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/8 bg-bg/70 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="from-accent-hover to-accent glow-accent flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-on-accent">
          H
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-fg text-sm font-bold">HoopMind</span>
          <span className="text-fg-muted text-[10px] tracking-widest uppercase">
            Become Unstoppable
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegación">
        <ul className="flex flex-col gap-0.5">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent/12 text-accent"
                      : "text-fg-muted hover:bg-white/5 hover:text-fg",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      active ? "glow-accent bg-accent/15" : "bg-white/5",
                    )}
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={item.icon} />
                    </svg>
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
