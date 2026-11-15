"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: <Icon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/gym",
    label: "Gym",
    icon: <Icon d="M6 7v10M18 7v10M6 12h12M3 9v6M21 9v6" />,
    match: (p) => p.startsWith("/gym"),
  },
  {
    href: "/coach",
    label: "Coach",
    icon: <Icon d="M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 21a7 7 0 0 1 14 0" />,
    match: (p) => p.startsWith("/coach"),
  },
  {
    href: "/plays",
    label: "Pizarra",
    icon: <Icon d="M4 4h16v16H4zM4 9h16M9 9v11" />,
    match: (p) => p.startsWith("/plays") || p.startsWith("/train") || p.startsWith("/analyze") || p.startsWith("/combine"),
  },
  {
    href: "/onboarding",
    label: "Perfil",
    icon: <Icon d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    match: (p) => p.startsWith("/onboarding"),
  },
];

/** Floating Pill Dock (v4): rounded, detached from the screen edges. */
export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Navegación principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-3"
    >
      <ul className="glass flex items-center gap-0.5 rounded-full px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-touch min-w-touch flex-col items-center justify-center gap-0.5 rounded-full px-3.5 py-1.5 transition-colors",
                  active ? "text-on-accent" : "text-fg-muted hover:text-fg",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="pilldock-active"
                    className="bg-gradient-to-b from-accent-hover to-accent glow-accent absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                  />
                ) : null}
                <motion.span
                  className="relative z-10"
                  animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                >
                  {item.icon}
                </motion.span>
                <span className="relative z-10 text-[10px] font-semibold tracking-wide">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
