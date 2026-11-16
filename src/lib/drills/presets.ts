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
  format: "FIVE_V_FIVE",
  keyCues: [
    "Espera a que el bloqueo esté plantado antes de salir.",
    "Ataca hombro con hombro, pegado a la pantalla.",
    "Lee al defensor del pívot: si ayuda, pasa al que rueda.",
  ],
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
  format: "ALL",
  keyCues: [
    "Vende la penetración con un primer paso agresivo.",
    "Frena con los dos pies para un step-back equilibrado.",
    "Empuja el balón atrás con el bote antes de recoger.",
  ],
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
  format: "ALL",
  keyCues: [
    "Prepara los pies antes de recibir (footwork previo).",
    "Manos listas como objetivo para el pasador.",
    "Tiro en un tiempo: sin bote intermedio.",
  ],
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

const giveAndGo: Drill = {
  id: "give_and_go",
  name: "Pasa y corta (Give & Go)",
  description:
    "El base pasa al ala y corta de inmediato hacia el aro buscando la devolución para una bandeja.",
  format: "FIVE_V_FIVE",
  keyCues: [
    "Corta justo después de pasar, sin esperar.",
    "Cambia de ritmo para despegarte del defensor.",
    "Pide el balón con la mano alejada del defensa.",
  ],
  entities: [
    { id: "pg", kind: "player", start: { x: 0.34, y: 0.78 }, tag: "1" },
    { id: "wing", kind: "player", start: { x: 0.72, y: 0.6 }, tag: "2" },
    { id: "dx", kind: "defender", start: { x: 0.36, y: 0.68 }, tag: "X1" },
    { id: "ball", kind: "ball", start: { x: 0.34, y: 0.78 } },
  ],
  steps: [
    {
      label: "El base (1) pasa al ala (2).",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.34, y: 0.78 },
            { x: 0.72, y: 0.6 },
          ],
          durationMs: 600,
        },
      ],
    },
    {
      label: "El base corta hacia el aro con cambio de ritmo (give & go).",
      moves: [
        {
          entity: "pg",
          kind: "run",
          path: [
            { x: 0.34, y: 0.78 },
            { x: 0.42, y: 0.5 },
            { x: 0.5, y: 0.26 },
          ],
          changeOfPace: true,
          durationMs: 1100,
        },
      ],
    },
    {
      label: "El ala devuelve el balón y el base finaliza en bandeja.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.72, y: 0.6 },
            { x: 0.5, y: 0.26 },
          ],
          durationMs: 550,
        },
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.5, y: 0.26 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 450,
        },
      ],
    },
  ],
};

const hornsSet: Drill = {
  id: "horns_set",
  name: 'Set "Horns"',
  description:
    "Formación con dos postes arriba (codos) y tiradores en las esquinas; el base elige bloqueo y crea ventaja.",
  format: "FIVE_V_FIVE",
  keyCues: [
    "Dos grandes en los codos abren el centro.",
    "Esquinas ocupadas para castigar la ayuda.",
    "El base lee qué bloqueo usar según la defensa.",
  ],
  entities: [
    { id: "pg", kind: "player", start: { x: 0.5, y: 0.8 }, tag: "1" },
    { id: "b1", kind: "player", start: { x: 0.36, y: 0.46 }, tag: "4" },
    { id: "b2", kind: "player", start: { x: 0.64, y: 0.46 }, tag: "5" },
    { id: "c1", kind: "player", start: { x: 0.08, y: 0.2 }, tag: "2" },
    { id: "c2", kind: "player", start: { x: 0.92, y: 0.2 }, tag: "3" },
    { id: "ball", kind: "ball", start: { x: 0.5, y: 0.8 } },
  ],
  steps: [
    {
      label: "Formación Horns: dos postes en los codos, tiradores en esquinas.",
      moves: [],
    },
    {
      label: "El poste derecho (5) sube a bloquear al base.",
      moves: [
        {
          entity: "b2",
          kind: "screen",
          path: [
            { x: 0.64, y: 0.46 },
            { x: 0.56, y: 0.62 },
          ],
          durationMs: 800,
        },
      ],
    },
    {
      label: "El base usa el bloqueo y penetra; el otro poste (4) abre al perímetro.",
      moves: [
        {
          entity: "pg",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.8 },
            { x: 0.44, y: 0.6 },
            { x: 0.42, y: 0.42 },
          ],
          changeOfPace: true,
          durationMs: 1100,
        },
        {
          entity: "ball",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.8 },
            { x: 0.42, y: 0.42 },
          ],
          durationMs: 1100,
        },
        {
          entity: "b1",
          kind: "run",
          path: [
            { x: 0.36, y: 0.46 },
            { x: 0.2, y: 0.5 },
          ],
          durationMs: 1000,
        },
      ],
    },
    {
      label: "El base asiste al poste que abre para un tiro cómodo.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.42, y: 0.42 },
            { x: 0.2, y: 0.5 },
          ],
          durationMs: 550,
        },
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.2, y: 0.5 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 750,
        },
      ],
    },
  ],
};

const isoCrossJab: Drill = {
  id: "iso_cross_jab",
  name: "Aislamiento: cruce + jab",
  description:
    "Uno contra uno: jab step para fijar al defensor, cruce de bote y tiro o penetración.",
  format: "ALL",
  keyCues: [
    "Jab agresivo para medir la reacción del defensor.",
    "Cruce bajo y explosivo para ganar el hombro.",
    "Decide rápido: si cierra, tira; si abre, penetra.",
  ],
  entities: [
    { id: "iso", kind: "player", start: { x: 0.5, y: 0.7 }, tag: "1" },
    { id: "dx", kind: "defender", start: { x: 0.5, y: 0.58 }, tag: "X1" },
    { id: "ball", kind: "ball", start: { x: 0.5, y: 0.7 } },
  ],
  steps: [
    {
      label: "Jab step: amaga un paso para fijar al defensor.",
      moves: [
        {
          entity: "iso",
          kind: "run",
          path: [
            { x: 0.5, y: 0.7 },
            { x: 0.54, y: 0.66 },
            { x: 0.5, y: 0.7 },
          ],
          durationMs: 700,
        },
      ],
    },
    {
      label: "Cruce de bote explosivo para ganar el hombro al defensor.",
      moves: [
        {
          entity: "iso",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.7 },
            { x: 0.4, y: 0.6 },
            { x: 0.36, y: 0.48 },
          ],
          changeOfPace: true,
          durationMs: 1000,
        },
        {
          entity: "ball",
          kind: "dribble",
          path: [
            { x: 0.5, y: 0.7 },
            { x: 0.36, y: 0.48 },
          ],
          durationMs: 1000,
        },
      ],
    },
    {
      label: "Tiro en suspensión tras ganar la ventaja.",
      moves: [
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.36, y: 0.48 },
            { x: 0.44, y: 0.28 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 750,
        },
      ],
    },
  ],
};

const threeVThreeMotion: Drill = {
  id: "three_v_three_motion",
  name: "Motion 3x3 (check-ball)",
  description:
    "Movimiento continuo 3x3: check-ball, pase-y-corta y reemplazos para generar un tiro abierto.",
  format: "THREE_X_THREE",
  keyCues: [
    "Tras el check-ball, mueve el balón de inmediato.",
    "Corta y reemplaza: nadie se queda parado.",
    "Busca el tiro antes de que la defensa se reajuste.",
  ],
  entities: [
    { id: "p1", kind: "player", start: { x: 0.5, y: 0.82 }, tag: "1" },
    { id: "p2", kind: "player", start: { x: 0.18, y: 0.52 }, tag: "2" },
    { id: "p3", kind: "player", start: { x: 0.82, y: 0.52 }, tag: "3" },
    { id: "ball", kind: "ball", start: { x: 0.5, y: 0.82 } },
  ],
  steps: [
    {
      label: "Check-ball en el perímetro; empieza la posesión 3x3.",
      moves: [],
    },
    {
      label: "El 1 pasa al 2 y corta a la esquina contraria.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.5, y: 0.82 },
            { x: 0.18, y: 0.52 },
          ],
          durationMs: 550,
        },
        {
          entity: "p1",
          kind: "run",
          path: [
            { x: 0.5, y: 0.82 },
            { x: 0.7, y: 0.6 },
            { x: 0.82, y: 0.52 },
          ],
          changeOfPace: true,
          durationMs: 1000,
        },
      ],
    },
    {
      label: "El 3 reemplaza arriba y recibe para tiro exterior.",
      moves: [
        {
          entity: "p3",
          kind: "run",
          path: [
            { x: 0.82, y: 0.52 },
            { x: 0.6, y: 0.66 },
          ],
          durationMs: 800,
        },
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.18, y: 0.52 },
            { x: 0.6, y: 0.66 },
          ],
          durationMs: 600,
        },
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.6, y: 0.66 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 750,
        },
      ],
    },
  ],
};

const backdoorCut: Drill = {
  id: "backdoor_cut",
  name: "Puerta atrás (Backdoor)",
  description:
    "Cuando el defensor sobre-marca la línea de pase, el atacante corta por detrás hacia el aro.",
  format: "FIVE_V_FIVE",
  keyCues: [
    "Lee la sobre-marca: si te niegan el balón, corta.",
    "Planta el pie y cambia de dirección hacia el aro.",
    "Tiempo con el pasador: ojos conectados.",
  ],
  entities: [
    { id: "pg", kind: "player", start: { x: 0.5, y: 0.8 }, tag: "1" },
    { id: "wing", kind: "player", start: { x: 0.16, y: 0.5 }, tag: "2" },
    { id: "dx", kind: "defender", start: { x: 0.22, y: 0.44 }, tag: "X2" },
    { id: "ball", kind: "ball", start: { x: 0.5, y: 0.8 } },
  ],
  steps: [
    {
      label: "El defensor (X2) sobre-marca y niega la línea de pase al ala.",
      moves: [
        {
          entity: "dx",
          kind: "run",
          path: [
            { x: 0.22, y: 0.44 },
            { x: 0.2, y: 0.52 },
          ],
          durationMs: 700,
        },
      ],
    },
    {
      label: "El ala (2) corta por detrás hacia el aro (puerta atrás).",
      moves: [
        {
          entity: "wing",
          kind: "run",
          path: [
            { x: 0.16, y: 0.5 },
            { x: 0.3, y: 0.34 },
            { x: 0.46, y: 0.22 },
          ],
          changeOfPace: true,
          durationMs: 1000,
        },
      ],
    },
    {
      label: "El base entrega el pase al corte y el ala finaliza.",
      moves: [
        {
          entity: "ball",
          kind: "pass",
          path: [
            { x: 0.5, y: 0.8 },
            { x: 0.46, y: 0.22 },
          ],
          durationMs: 650,
        },
        {
          entity: "ball",
          kind: "shot",
          path: [
            { x: 0.46, y: 0.22 },
            { x: 0.5, y: 0.12 },
          ],
          durationMs: 450,
        },
      ],
    },
  ],
};

export const DRILLS: Record<DrillId, Drill> = {
  pick_and_roll: pickAndRoll,
  dribble_drive_stepback: dribbleDriveStepback,
  catch_and_shoot_move: catchAndShootMove,
  give_and_go: giveAndGo,
  horns_set: hornsSet,
  iso_cross_jab: isoCrossJab,
  three_v_three_motion: threeVThreeMotion,
  backdoor_cut: backdoorCut,
};

export const DRILL_LIST: Drill[] = Object.values(DRILLS);

export function getDrill(id: DrillId): Drill {
  return DRILLS[id];
}
