"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Subtle per-route transition. Keyed on pathname so each navigation
 * re-mounts and animates in. Honors reduced-motion via the global CSS rule.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex min-h-full flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
