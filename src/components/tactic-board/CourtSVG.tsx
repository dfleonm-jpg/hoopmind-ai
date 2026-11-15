import * as React from "react";
import {
  BACKBOARD,
  COURT_H,
  COURT_W,
  FT_CIRCLE,
  HOOP,
  KEY,
  RESTRICTED_R,
  THREE,
  ZONES,
  type Zone,
} from "@/lib/court/geometry";

const LINE = "var(--color-fg-muted)";
const LINE_W = 2;

/** 3pt line path: left corner up, arc across the top, down to right corner. */
function threePointPath(): string {
  const { cornerX_left, cornerX_right, cornerTopY, radius } = THREE;
  // Arc sweeps around the hoop; endpoints are where the corners meet the arc.
  return [
    `M ${cornerX_left} 0`,
    `L ${cornerX_left} ${cornerTopY}`,
    `A ${radius} ${radius} 0 0 0 ${cornerX_right} ${cornerTopY}`,
    `L ${cornerX_right} 0`,
  ].join(" ");
}

export interface CourtSVGProps extends React.SVGProps<SVGSVGElement> {
  /** Render each zone polygon (used by the shot chart heatmap). */
  renderZone?: (zone: Zone) => React.ReactNode;
  /** Children drawn on top of the court (drill layer, tokens). */
  children?: React.ReactNode;
}

/**
 * Regulation half-court in SVG. Responsive via viewBox (works from 320px up).
 * Shares the zone geometry so the ShotChart can reuse this component.
 */
export function CourtSVG({ renderZone, children, ...svgProps }: CourtSVGProps) {
  return (
    <svg
      viewBox={`0 0 ${COURT_W} ${COURT_H}`}
      role="img"
      aria-label="Media cancha de baloncesto"
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      {...svgProps}
    >
      {/* Court background */}
      <rect
        x={0}
        y={0}
        width={COURT_W}
        height={COURT_H}
        fill="var(--color-card)"
      />

      {/* Optional zone polygons (shot chart) rendered below the lines */}
      {renderZone ? <g>{ZONES.map((z) => renderZone(z))}</g> : null}

      <g fill="none" stroke={LINE} strokeWidth={LINE_W}>
        {/* Perimeter */}
        <rect x={1} y={1} width={COURT_W - 2} height={COURT_H - 2} />

        {/* Paint / key */}
        <rect x={KEY.x} y={KEY.y} width={KEY.w} height={KEY.h} />

        {/* Free-throw circle (full; dashed lower half as a hint) */}
        <circle cx={FT_CIRCLE.cx} cy={FT_CIRCLE.cy} r={FT_CIRCLE.r} />

        {/* Backboard + hoop */}
        <line
          x1={BACKBOARD.x1}
          y1={BACKBOARD.y}
          x2={BACKBOARD.x2}
          y2={BACKBOARD.y}
          strokeWidth={LINE_W + 1}
        />
        <circle cx={HOOP.x} cy={HOOP.y} r={HOOP.r} stroke="var(--color-accent)" />

        {/* Restricted-area arc */}
        <path
          d={`M ${HOOP.x - RESTRICTED_R} ${HOOP.y} A ${RESTRICTED_R} ${RESTRICTED_R} 0 0 0 ${HOOP.x + RESTRICTED_R} ${HOOP.y}`}
        />

        {/* 3-point line */}
        <path d={threePointPath()} />
      </g>

      {children}
    </svg>
  );
}
