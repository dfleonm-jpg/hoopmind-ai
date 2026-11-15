/**
 * Drill data model for the animated tactic board.
 * Coordinates are normalized 0..1 over the half court (origin top-left,
 * hoop near the top). The board scales them into SVG user units.
 */

export type EntityKind = "player" | "defender" | "ball" | "cone";
export type MoveKind = "run" | "dribble" | "pass" | "shot" | "screen";

export interface Point {
  x: number; // 0..1
  y: number; // 0..1
}

export interface DrillMove {
  /** id of the entity that moves. */
  entity: string;
  kind: MoveKind;
  /** polyline/bezier control points in normalized coords. */
  path: Point[];
  /** marks a change of pace (hesitation / burst). */
  changeOfPace?: boolean;
  durationMs: number;
}

export interface DrillStep {
  /** textual description shown while paused / in reduced-motion mode. */
  label: string;
  moves: DrillMove[];
}

export interface DrillEntity {
  id: string;
  kind: EntityKind;
  /** starting position in normalized coords. */
  start: Point;
  /** short label drawn in the token, e.g. "1", "X", "●". */
  tag?: string;
}

export type DrillId =
  | "pick_and_roll"
  | "dribble_drive_stepback"
  | "catch_and_shoot_move";

export interface Drill {
  id: DrillId;
  name: string;
  description: string;
  entities: DrillEntity[];
  steps: DrillStep[];
}
