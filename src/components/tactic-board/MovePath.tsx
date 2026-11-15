"use client";

import { motion } from "framer-motion";
import type { DrillMove } from "@/lib/drills/types";
import { linePath, wavyPath } from "./path-utils";

const COLORS = {
  run: "var(--color-fg)",
  dribble: "var(--color-accent)",
  pass: "var(--color-success)",
  shot: "var(--color-accent)",
  screen: "var(--color-fg-muted)",
} as const;

export function MovePath({
  move,
  animate,
}: {
  move: DrillMove;
  /** when false, draw the full path statically (paused / reduced-motion). */
  animate: boolean;
}) {
  const isDribble = move.kind === "dribble";
  const d = isDribble ? wavyPath(move.path) : linePath(move.path);
  const dashed = move.kind === "pass" || move.kind === "shot";
  const color = COLORS[move.kind];

  const common = {
    d,
    fill: "none",
    stroke: color,
    strokeWidth: move.kind === "screen" ? 4 : 2.5,
    strokeLinecap: "round" as const,
    strokeDasharray: dashed ? "8 7" : move.kind === "screen" ? "2 6" : undefined,
  };

  if (!animate) {
    return <path {...common} />;
  }

  return (
    <motion.path
      {...common}
      initial={{ pathLength: 0, opacity: 0.4 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: move.durationMs / 1000, ease: "easeInOut" }}
    />
  );
}
