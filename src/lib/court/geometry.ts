/**
 * Half-court geometry in SVG user units.
 *
 * viewBox: 0 0 500 470  (50ft wide x 47ft half-court, scaled x10).
 * Origin is top-left. The basket/hoop is near the TOP of the view; the
 * half-court line is at the BOTTOM (y = 470). All drill coordinates are
 * normalized 0..1 and mapped into this box by `COURT_W`/`COURT_H`.
 */
export const COURT_W = 500;
export const COURT_H = 470;

// Hoop + key metrics (approximate FIBA/NBA proportions, x10).
export const HOOP = { x: 250, y: 52.5, r: 7.5 };
export const BACKBOARD = { x1: 220, x2: 280, y: 40 };
export const FT_CIRCLE = { cx: 250, cy: 190, r: 60 };
export const KEY = { x: 190, y: 0, w: 120, h: 190 }; // paint, from baseline to FT line
export const THREE = {
  // 3pt line: arc + the two straight corner segments.
  radius: 237.5,
  cornerX_left: 30,
  cornerX_right: 470,
  cornerTopY: 140, // where corners meet the arc
};
export const RESTRICTED_R = 40;

export type ZoneId =
  | "left_corner_3"
  | "left_wing_3"
  | "top_key_3"
  | "right_wing_3"
  | "right_corner_3"
  | "left_mid"
  | "center_mid"
  | "right_mid"
  | "paint"
  | "free_throw";

export interface Zone {
  id: ZoneId;
  label: string;
  /** SVG polygon points "x,y x,y ..." in court units. */
  points: string;
  /** Centroid for labels/tooltips. */
  centroid: { x: number; y: number };
}

/**
 * Ten shot zones as polygons covering the half court. Shapes are approximate
 * (polygonal) so they tile cleanly and can be filled by the heatmap.
 */
export const ZONES: Zone[] = [
  {
    id: "left_corner_3",
    label: "Esquina izq. (3)",
    points: "0,0 30,0 30,140 0,140",
    centroid: { x: 15, y: 75 },
  },
  {
    id: "right_corner_3",
    label: "Esquina der. (3)",
    points: "470,0 500,0 500,140 470,140",
    centroid: { x: 485, y: 75 },
  },
  {
    id: "left_wing_3",
    label: "Ala izq. (3)",
    points: "0,140 30,140 120,330 0,470",
    centroid: { x: 45, y: 290 },
  },
  {
    id: "right_wing_3",
    label: "Ala der. (3)",
    points: "470,140 500,140 500,470 380,330",
    centroid: { x: 455, y: 290 },
  },
  {
    id: "top_key_3",
    label: "Frontal (3)",
    points: "120,330 250,360 380,330 500,470 0,470",
    centroid: { x: 250, y: 420 },
  },
  {
    id: "paint",
    label: "Zona (pintura)",
    points: "190,0 310,0 310,190 190,190",
    centroid: { x: 250, y: 110 },
  },
  {
    id: "free_throw",
    label: "Tiro libre",
    points: "190,190 310,190 310,250 190,250",
    centroid: { x: 250, y: 220 },
  },
  {
    id: "left_mid",
    label: "Media izq.",
    points: "30,140 190,140 190,330 120,330",
    centroid: { x: 120, y: 230 },
  },
  {
    id: "center_mid",
    label: "Media central",
    points: "190,250 310,250 310,360 250,360 190,360",
    centroid: { x: 250, y: 300 },
  },
  {
    id: "right_mid",
    label: "Media der.",
    points: "310,140 470,140 380,330 310,330",
    centroid: { x: 380, y: 230 },
  },
];

/** Map a normalized (0..1) point into court user units. */
export function toCourt(p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x * COURT_W, y: p.y * COURT_H };
}
