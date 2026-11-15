import { COURT_H, COURT_W } from "@/lib/court/geometry";
import type { Point } from "@/lib/drills/types";

/** Map a normalized point to court user units. */
export function scale(p: Point): { x: number; y: number } {
  return { x: p.x * COURT_W, y: p.y * COURT_H };
}

/** Straight polyline path (run / pass / shot). */
export function linePath(points: Point[]): string {
  if (points.length === 0) return "";
  const pts = points.map(scale);
  const [first, ...rest] = pts;
  if (!first) return "";
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((p) => `L ${p.x} ${p.y}`).join(" ")
  );
}

/**
 * Wavy path for dribbles: perturb the polyline with small perpendicular
 * zig-zags so the trajectory reads as a bounce.
 */
export function wavyPath(points: Point[], amplitude = 6): string {
  const pts = points.map(scale);
  if (pts.length < 2) return linePath(points);

  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  const steps = 24;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // unit perpendicular
    const nx = -dy / len;
    const ny = dx / len;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const bx = a.x + dx * t;
      const by = a.y + dy * t;
      const wobble = Math.sin(t * Math.PI * 6) * amplitude;
      d += ` L ${(bx + nx * wobble).toFixed(1)} ${(by + ny * wobble).toFixed(1)}`;
    }
  }
  return d;
}

export function endPoint(points: Point[]): Point {
  return points[points.length - 1] ?? { x: 0, y: 0 };
}

export function startPoint(points: Point[]): Point {
  return points[0] ?? { x: 0, y: 0 };
}
