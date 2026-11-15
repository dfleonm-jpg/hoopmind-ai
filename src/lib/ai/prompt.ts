import "server-only";

import type { Profile } from "@prisma/client";
import type { GenerateWorkoutInput } from "@/lib/ai/schema";
import { BLOCK_ORDER } from "@/lib/ai/schema";
import type { PerformanceDiagnosis } from "@/lib/ai/performance";
import { computeAnthro } from "@/lib/anthropometry/calc";

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
  STRENGTH: "fuerza",
  ENDURANCE: "resistencia",
  SPEED: "velocidad",
  WEIGHT_LOSS: "pérdida de grasa",
  MUSCLE_GAIN: "masa muscular",
  MOBILITY: "movilidad",
  IQ: "IQ de juego / toma de decisiones",
  FINISHING: "finalización cerca del aro",
};

const SCENARIO_ES: Record<GenerateWorkoutInput["scenario"], string> = {
  FULL_COURT: "cancha completa (con aro)",
  HALF_COURT: "media cancha (con aro)",
  STREET: "calle/parque",
  GYM_NO_HOOP: "gimnasio sin aro (solo balón)",
  PHYSICAL_ONLY: "físico / explosividad (sin balón ni aro)",
};

/** Scenarios where no basket is available for shooting (Req. 3.5). */
function hasHoop(scenario: GenerateWorkoutInput["scenario"]): boolean {
  return scenario === "FULL_COURT" || scenario === "HALF_COURT";
}

const READINESS_RULES: Record<string, string[]> = {
  FRESH: [
    "El jugador está al 100%: puedes exigir alta intensidad y mayor volumen en técnica, finalización y acondicionamiento.",
  ],
  FATIGUED: [
    "El jugador tiene las piernas pesadas: reduce el volumen total ~25%, baja la pliometría y los sprints, aumenta los descansos entre series y prioriza técnica de calidad sobre cantidad.",
  ],
  RECOVERY: [
    "El jugador está en recuperación: sesión suave de bajo impacto (movilidad, mecánica en seco, tiro sin salto agresivo, core ligero). EVITA saltos máximos, cambios de dirección explosivos y alto volumen; protege rodillas, tobillos y cadera.",
  ],
};

export const SYSTEM_PROMPT = `Eres un entrenador profesional de baloncesto que diseña sesiones de entrenamiento individuales.
Devuelves ÚNICAMENTE una sesión estructurada que cumple el esquema proporcionado. No añadas texto fuera del objeto.

Reglas obligatorias:
- La sesión SIEMPRE tiene exactamente 5 bloques en este orden: ${BLOCK_ORDER.join(" → ")}.
- La suma de 'durationMin' de los bloques debe ser igual a 'totalDurationMin' (tolerancia ±2 min) y respetar el tiempo total solicitado.
- Cada bloque tiene entre 1 y 6 ejercicios, con 'name', 'description', 'reps' e 'intensity' (LOW | MEDIUM | HIGH).
- Ajusta el volumen y la intensidad al nivel del jugador y prioriza sus objetivos.
- Vincula 'drillId' SOLO cuando el ejercicio corresponda claramente a uno de estos drills precargados; en cualquier otro caso usa null:
  * 'pick_and_roll': bloqueo directo, lectura de la pantalla y continuación (tiro/pase).
  * 'dribble_drive_stepback': penetración en bote con finalización en step-back.
  * 'catch_and_shoot_move': recepción en movimiento y tiro inmediato.
  * 'give_and_go': pasa y corta (dar-y-va) buscando la línea de fondo.
  * 'horns_set': set "Horns" con dos postes arriba y espacio en esquinas.
  * 'iso_cross_jab': aislamiento con cruce y jab para liberar el tiro.
  * 'three_v_three_motion': movimiento 3x3 con check-ball y cortes continuos.
  * 'backdoor_cut': puerta atrás tras sobre-marca del defensor.
- Español claro y conciso. Términos de baloncesto correctos.`;

export function buildWorkoutPrompt(
  profile: Profile,
  input: GenerateWorkoutInput,
  difficulty: number,
  diagnosis?: PerformanceDiagnosis,
  includePhysical?: boolean,
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

  const scenarioRules =
    input.scenario === "PHYSICAL_ONLY"
      ? [
          `Escenario: ${SCENARIO_ES[input.scenario]}. Sesión de preparación física SIN balón ni aro.`,
          "Todos los bloques se orientan a físico: TECHNIQUE y FINISHING se reinterpretan como trabajo de pies, mecánica de salto y coordinación; CONDITIONING incluye potencia vertical (pliometría), agilidad lateral y core; WARMUP con movilidad y activación; COOLDOWN con estiramientos.",
          "PROHIBIDO cualquier ejercicio con balón o canasta.",
        ]
      : hoop
        ? [
            `Escenario: ${SCENARIO_ES[input.scenario]}. Puedes incluir finalizaciones y tiros a canasta.`,
          ]
        : [
            `Escenario: ${SCENARIO_ES[input.scenario]} SIN ARO. PROHIBIDO cualquier ejercicio que requiera canasta (nada de tiros a aro, bandejas ni finalizaciones al aro).`,
            "Sustituye el trabajo de tiro por: mecánica de tiro en seco (form shooting contra pared o al aire), manejo de balón, trabajo de pies, cambios de ritmo/dirección y acondicionamiento.",
            "El bloque FINISHING debe centrarse en finalizaciones simuladas sin aro (ataque de un cono/defensor imaginario, euro-step y recogida) y toma de decisión, no en encestar.",
          ];

  // Readiness (v3): calibrate volume, rest and joint protection.
  const readinessRules = input.readiness
    ? (READINESS_RULES[input.readiness] ?? [])
    : [];
  if (input.readiness === "RECOVERY" || input.readiness === "FATIGUED") {
    readinessRules.push(
      `Protege las articulaciones según el físico (${profile.heightCm} cm, ${profile.weightKg} kg): cuanto más alto/pesado, más cuidado con rodillas, tobillos y cadera en impactos y aterrizajes.`,
    );
  }

  // Performance memory (v2): steer the session toward the coldest zones.
  const diagnosisRules: string[] = [];
  if (diagnosis?.hasHistory) {
    if (diagnosis.weakZones.length > 0 && hoop) {
      const zones = diagnosis.weakZones
        .map((z) => `${z.label} (${Math.round(z.pct * 100)}% en ${z.attempted} intentos)`)
        .join(" y ");
      diagnosisRules.push(
        `Zonas más frías del jugador: ${zones}. Prioriza ejercicios correctivos de tiro/finalización desde esas zonas en los bloques TECHNIQUE y FINISHING.`,
      );
    } else if (diagnosis.weakZones.length > 0) {
      diagnosisRules.push(
        "Sin aro no se puede tirar a canasta, pero refuerza la mecánica en seco orientada a las zonas débiles del jugador.",
      );
    }
    if (diagnosis.fatigue === "high") {
      diagnosisRules.push(
        "El jugador ha entrenado mucho en los últimos 3 días (fatiga alta): baja el volumen del acondicionamiento, prioriza técnica y añade más recuperación en la vuelta a la calma.",
      );
    } else if (diagnosis.fatigue === "fresh") {
      diagnosisRules.push(
        "El jugador llega fresco: puedes exigir algo más de intensidad en el acondicionamiento.",
      );
    }
    if (diagnosis.streakDays >= 3) {
      diagnosisRules.push(
        `Lleva una racha de ${diagnosis.streakDays} días; mantén la motivación con variedad de ejercicios.`,
      );
    }
  }

  // Anthropometry-driven mechanics (v4 Fase 6).
  const anthro = computeAnthro(profile);
  const anthroRules: string[] = [];
  if (anthro.femurClass === "LONG_FEMUR") {
    anthroRules.push(
      "Fémur largo: en sentadillas usa una postura más abierta, talones elevados o trap bar para proteger la espalda baja; prioriza control excéntrico de rodilla y no penalices una inclinación natural del torso.",
    );
  } else if (anthro.femurClass === "SHORT_LEVER") {
    anthroRules.push(
      "Palancas cortas: el jugador puede mantener un torso vertical en sentadilla; buen candidato para trabajo de fuerza de piernas.",
    );
  }
  if (anthro.apeIndexCm != null && anthro.apeIndexCm >= 5) {
    anthroRules.push(
      "Ape Index positivo: en el bloque de baloncesto aprovecha finalizaciones extendidas, líneas de pase y defensa de brazos largos.",
    );
  }

  // Optional explosive-physical emphasis calibrated to body metrics (v2 Block 4).
  const physicalRules: string[] = includePhysical
    ? [
        "Incluye trabajo físico explosivo integrado en los bloques CONDITIONING y WARMUP: potencia vertical (saltos), agilidad lateral y core.",
        `Calibra la carga al físico del jugador (${profile.heightCm} cm, ${profile.weightKg} kg): jugadores más altos/pesados priorizan técnica de aterrizaje y movilidad; más ligeros pueden asumir mayor pliometría.`,
      ]
    : [];

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
    ...(diagnosisRules.length
      ? ["", "Diagnóstico de rendimiento reciente:", ...diagnosisRules.map((r) => `- ${r}`)]
      : []),
    ...(physicalRules.length
      ? ["", "Trabajo físico:", ...physicalRules.map((r) => `- ${r}`)]
      : []),
    ...(anthroRules.length
      ? ["", "Antropometría (ajusta la mecánica):", ...anthroRules.map((r) => `- ${r}`)]
      : []),
  ].join("\n");
}
