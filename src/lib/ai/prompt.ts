import "server-only";

import type { Profile } from "@prisma/client";
import type { GenerateWorkoutInput } from "@/lib/ai/schema";
import { BLOCK_ORDER } from "@/lib/ai/schema";

const POSITION_ES: Record<Profile["position"], string> = {
  PG: "Base",
  SG: "Escolta",
  SF: "Alero",
  PF: "Ala-Pívot",
  C: "Pívot",
};

const LEVEL_ES: Record<Profile["level"], string> = {
  BEGINNER: "principiante",
  INTERMEDIATE: "intermedio",
  ADVANCED: "avanzado",
};

const GOAL_ES: Record<string, string> = {
  SHOOTING: "tiro exterior",
  BALL_HANDLING: "ball handling",
  VERTICAL: "explosividad vertical",
  DEFENSE: "defensa",
};

const SCENARIO_ES: Record<GenerateWorkoutInput["scenario"], string> = {
  FULL_COURT: "cancha completa (con aro)",
  HALF_COURT: "media cancha (con aro)",
  STREET: "calle/parque",
  GYM_NO_HOOP: "gimnasio sin aro",
};

/** Scenarios where no basket is available for shooting (Req. 3.5). */
function hasHoop(scenario: GenerateWorkoutInput["scenario"]): boolean {
  return scenario === "FULL_COURT" || scenario === "HALF_COURT";
}

export const SYSTEM_PROMPT = `Eres un entrenador profesional de baloncesto que diseña sesiones de entrenamiento individuales.
Devuelves ÚNICAMENTE una sesión estructurada que cumple el esquema proporcionado. No añadas texto fuera del objeto.

Reglas obligatorias:
- La sesión SIEMPRE tiene exactamente 5 bloques en este orden: ${BLOCK_ORDER.join(" → ")}.
- La suma de 'durationMin' de los bloques debe ser igual a 'totalDurationMin' (tolerancia ±2 min) y respetar el tiempo total solicitado.
- Cada bloque tiene entre 1 y 6 ejercicios, con 'name', 'description', 'reps' e 'intensity' (LOW | MEDIUM | HIGH).
- Ajusta el volumen y la intensidad al nivel del jugador y prioriza sus objetivos.
- Vincula 'drillId' SOLO cuando el ejercicio corresponda claramente a uno de estos drills precargados; en cualquier otro caso usa null:
  * 'pick_and_roll': trabajo de bloqueo y continuación (lectura de la pantalla, salida y tiro/pase).
  * 'dribble_drive_stepback': penetración en bote con finalización en step-back.
  * 'catch_and_shoot_move': recepción en movimiento y tiro inmediato.
- Español claro y conciso. Términos de baloncesto correctos.`;

export function buildWorkoutPrompt(
  profile: Profile,
  input: GenerateWorkoutInput,
  difficulty: number,
): string {
  const goals = profile.goals.map((g) => GOAL_ES[g] ?? g).join(", ");
  const hoop = hasHoop(input.scenario);

  const formatRules =
    profile.format === "THREE_X_THREE"
      ? [
          "Formato 3x3 (medio campo): prioriza posesiones cortas (reloj de ~12 s), transiciones ofensiva-defensa muy rápidas, 'check-ball' tras cada canasta, uno-contra-uno, tiro rápido tras bote y lectura de 2x2.",
          "Reduce ejercicios de cancha completa; enfatiza explosividad en espacios cortos, finalización bajo contacto y tiro desde el perímetro de 3x3.",
        ]
      : [
          "Formato 5v5 (cancha completa): incluye transición, espaciado de 5 jugadores, juego sin balón, cortes, y lecturas de bloqueo directo/indirecto.",
          "Combina técnica individual con patrones aplicables a situaciones de equipo.",
        ];

  const scenarioRules = hoop
    ? [
        `Escenario: ${SCENARIO_ES[input.scenario]}. Puedes incluir finalizaciones y tiros a canasta.`,
      ]
    : [
        `Escenario: ${SCENARIO_ES[input.scenario]} SIN ARO. PROHIBIDO cualquier ejercicio que requiera canasta (nada de tiros a aro, bandejas ni finalizaciones al aro).`,
        "Sustituye el trabajo de tiro por: mecánica de tiro en seco (form shooting contra pared o al aire), manejo de balón, trabajo de pies, cambios de ritmo/dirección y acondicionamiento.",
        "El bloque FINISHING debe centrarse en finalizaciones simuladas sin aro (ataque de un cono/defensor imaginario, euro-step y recogida) y toma de decisión, no en encestar.",
      ];

  return [
    "Diseña una sesión de entrenamiento individual con estos datos del jugador:",
    `- Posición: ${POSITION_ES[profile.position]}`,
    `- Nivel: ${LEVEL_ES[profile.level]}`,
    `- Mano dominante: ${profile.handedness === "LEFT" ? "zurdo" : "diestro"}`,
    `- Altura: ${profile.heightCm} cm, Peso: ${profile.weightKg} kg`,
    `- Objetivos prioritarios: ${goals}`,
    `- Tiempo total disponible: ${input.durationMin} min (ajusta totalDurationMin a este valor).`,
    `- Dificultad objetivo (1–5): ${difficulty}.`,
    "",
    "Reglas de formato:",
    ...formatRules.map((r) => `- ${r}`),
    "",
    "Reglas de escenario:",
    ...scenarioRules.map((r) => `- ${r}`),
  ].join("\n");
}
