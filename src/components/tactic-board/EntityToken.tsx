"use client";

import { motion } from "framer-motion";
import type { DrillEntity, Point } from "@/lib/drills/types";
import { scale } from "./path-utils";

const STYLE = {
  player: { fill: "var(--color-accent)", text: "var(--color-on-accent)", r: 13 },
  defender: { fill: "var(--color-card)", text: "var(--color-fg)", r: 13 },
  ball: { fill: "var(--color-fg)", text: "transparent", r: 7 },
  cone: { fill: "var(--color-fg-muted)", text: "transparent", r: 6 },
} as const;

export function EntityToken({
  entity,
  at,
  animatePath,
  durationMs,
}: {
  entity: DrillEntity;
  /** current logical position (normalized) when static. */
  at: Point;
  /** when set, animate the token along these normalized points. */
  animatePath?: Point[];
  durationMs?: number;
}) {
  const s = STYLE[entity.kind];
  const pos = scale(at);
  const stroke =
    entity.kind === "defender" ? "var(--color-danger)" : "transparent";

  const animateProps =
    animatePath && animatePath.length > 0
      ? {
          cx: animatePath.map((p) => scale(p).x),
          cy: animatePath.map((p) => scale(p).y),
        }
      : { cx: pos.x, cy: pos.y };

  const textAnimate =
    animatePath && animatePath.length > 0
      ? {
          x: animatePath.map((p) => scale(p).x),
          y: animatePath.map((p) => scale(p).y + 4),
        }
      : { x: pos.x, y: pos.y + 4 };

  const transition = {
    duration: (durationMs ?? 0) / 1000,
    ease: "easeInOut" as const,
  };

  return (
    <g>
      <motion.circle
        r={s.r}
        fill={s.fill}
        stroke={stroke}
        strokeWidth={2}
        animate={animateProps}
        transition={transition}
      />
      {entity.tag ? (
        <motion.text
          fontSize={13}
          fontWeight={700}
          textAnchor="middle"
          fill={s.text}
          animate={textAnimate}
          transition={transition}
        >
          {entity.tag}
        </motion.text>
      ) : null}
    </g>
  );
}
