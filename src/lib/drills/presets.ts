import type { Drill, DrillId } from "@/lib/drills/types";

/**
 * Three preloaded drills (Req. 4.3). Normalized coords: x in [0,1] left→right,
 * y in [0,1] top(hoop)→bottom(half-court line). Hoop ≈ (0.50, 0.11).
 */

const pickAndRoll: Drill = {
  id: "pick_and_roll",
  name: "Pick & Roll",
  description:
    "Bloqueo directo: el base usa la pantalla del pívot, ataca y juega la continuación (pase al que rueda o tiro).",
  entities: [
    { id: "pg", kind: "player", start: { x: 0.5, y: 0.82 }, tag: "1" },
    { id: "big", kind: "player", start: { x: 0.66, y: 0.6 }, tag: "5" },
    { id: "dx", kind: "defender", start: { x: 0.5, y: 0.72 }, tag: "X1" },
    { id: "ball", kind: "ball", start: { x: 0.5, y: 0.82 } },
  ],
  steps: [
    {
      label: "El pívot (5) sube a poner el bloqueo directo al defensor del base.",
      moves: [
        {
          entity: "big",
          kind: "screen",
          path: [
            { x: 0.66, y: 0.6 },
            { x: 0.56, y: 0.66 },
          ],
          durationMs: 900,
        },
      ],
    },
    {
      label: "El base (1) bota usando la pantalla y cambia de ritmo hacia el centro.",
      moves: [
        {
          entity: "pg",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.82 },
            { x: 0.46, y: 0.7 },
            { x: 0.42, y: 0.55 },
          ],
          changeOfPace: true,
          durationMs: 1200,
        },
        {
          entity: "ball",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.82 },
            { x: 0.46, y: 0.7 },
            { x: 0.42, y: 0.55 },
          ],
          durationMs: 1200,
        },
      ],
    },
    {
      label: "El pívot rueda al aro tras el bloqueo (roll).",
      moves: [
        {
          entity: "big",
          kind: "run",
          path: [
            { x: 0.56, y: 0.66 },
            { x: 0.52, y: 0.4 },
            { x: 0.5, y: 0.22 },
          ],
          durationMs: 1100,
        },
      ],
    },
    {
      label: "El base pasa al pívot que rueda y éste finaliza en el aro.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.42, y: 0.55 },
            { x: 0.5, y: 0.22 },
          ],
          durationMs: 700,
        },
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.5, y: 0.22 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 500,
        },
      ],
    },
  ],
};

const dribbleDriveStepback: Drill = {
  id: "dribble_drive_stepback",
  name: "Dribble Drive con Step-back",
  description:
    "Ataque al aro en bote, freno brusco y step-back hacia atrás para liberar el triple.",
  entities: [
    { id: "pg", kind: "player", start: { x: 0.3, y: 0.78 }, tag: "1" },
    { id: "dx", kind: "defender", start: { x: 0.36, y: 0.66 }, tag: "X1" },
    { id: "ball", kind: "ball", start: { x: 0.3, y: 0.78 } },
  ],
  steps: [
    {
      label: "El atacante ataca el aro en bote para fijar a su defensor.",
      moves: [
        {
          entity: "pg",
          kind: "dribble",
          path: [
            { x: 0.3, y: 0.78 },
            { x: 0.36, y: 0.6 },
            { x: 0.4, y: 0.45 },
          ],
          changeOfPace: true,
          durationMs: 1200,
        },
        {
          entity: "ball",
          kind: "dribble",
          path: [
            { x: 0.3, y: 0.78 },
            { x: 0.36, y: 0.6 },
            { x: 0.4, y: 0.45 },
          ],
          durationMs: 1200,
        },
        {
          entity: "dx",
          kind: "run",
          path: [
            { x: 0.36, y: 0.66 },
            { x: 0.4, y: 0.5 },
          ],
          durationMs: 1200,
        },
      ],
    },
    {
      label: "Frena en seco y ejecuta el step-back creando separación hacia atrás.",
      moves: [
        {
          entity: "pg",
          kind: "dribble",
          path: [
            { x: 0.4, y: 0.45 },
            { x: 0.32, y: 0.58 },
            { x: 0.26, y: 0.66 },
          ],
          changeOfPace: true,
          durationMs: 900,
        },
        {
          entity: "ball",
          kind: "dribble",
          path: [
            { x: 0.4, y: 0.45 },
            { x: 0.26, y: 0.66 },
          ],
          durationMs: 900,
        },
      ],
    },
    {
      label: "Liberado del defensor, lanza el triple en suspensión.",
      moves: [
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.26, y: 0.66 },
            { x: 0.38, y: 0.3 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 800,
        },
      ],
    },
  ],
};

const catchAndShootMove: Drill = {
  id: "catch_and_shoot_move",
  name: "Catch & Shoot en movimiento",
  description:
    "Corte sin balón, recepción en movimiento y tiro rápido con los pies ya orientados al aro.",
  entities: [
    { id: "shooter", kind: "player", start: { x: 0.14, y: 0.6 }, tag: "2" },
    { id: "passer", kind: "player", start: { x: 0.72, y: 0.75 }, tag: "1" },
    { id: "ball", kind: "ball", start: { x: 0.72, y: 0.75 } },
  ],
  steps: [
    {
      label: "El tirador (2) corta sin balón desde la esquina hacia el ala.",
      moves: [
        {
          entity: "shooter",
          kind: "run",
          path: [
            { x: 0.14, y: 0.6 },
            { x: 0.2, y: 0.5 },
            { x: 0.26, y: 0.46 },
          ],
          changeOfPace: true,
          durationMs: 1100,
        },
      ],
    },
    {
      label: "El base (1) entrega el pase al tirador en movimiento.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.72, y: 0.75 },
            { x: 0.26, y: 0.46 },
          ],
          durationMs: 650,
        },
      ],
    },
    {
      label: "Recepción con los pies ya listos y tiro rápido (catch & shoot).",
      moves: [
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.26, y: 0.46 },
            { x: 0.38, y: 0.26 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 750,
        },
      ],
    },
  ],
};

export const DRILLS: Record<DrillId, Drill> = {
  pick_and_roll: pickAndRoll,
  dribble_drive_stepback: dribbleDriveStepback,
  catch_and_shoot_move: catchAndShootMove,
};

export function getDrill(id: DrillId): Drill {
  return DRILLS[id];
}
