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
  /** match when the pathname starts with this (for nested routes). */
  match: (path: string) => boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      width={24}
      height={24}
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
    href: "/dashboard?train=1",
    label: "Entrenar",
    icon: <Icon d="M6 7v10M18 7v10M6 12h12M3 9v6M21 9v6" />,
    match: (p) => p.startsWith("/train"),
  },
  {
    href: "/plays",
    label: "Pizarra",
    icon: <Icon d="M4 4h16v16H4zM4 9h16M9 9v11" />,
    match: (p) => p.startsWith("/plays"),
  },
  {
    href: "/analyze",
    label: "Analizar",
    icon: <Icon d="M23 7l-7 5 7 5V7zM1 5h15v14H1z" />,
    match: (p) => p.startsWith("/analyze"),
  },
  {
    href: "/onboarding",
    label: "Perfil",
    icon: <Icon d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    match: (p) => p.startsWith("/onboarding"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Navegación principal"
      className="glass pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/10 sm:mx-auto sm:max-w-md sm:rounded-t-2xl"
    >
      <ul className="flex items-stretch justify-around px-2">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-touch flex-col items-center justify-center gap-0.5 py-2",
                  active ? "text-accent" : "text-fg-muted hover:text-fg",
                )}
              >
                <motion.span
                  animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                >
                  {item.icon}
                </motion.span>
                <span className="text-[11px] font-medium">{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="bottomnav-indicator"
                    className="bg-accent absolute top-0 h-0.5 w-8 rounded-full"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
