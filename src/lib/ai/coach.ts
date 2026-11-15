import "server-only";

import { generateText } from "ai";
import { model } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/generate";

export type CoachSpecialty =
  | "BASKETBALL"
  | "STRENGTH"
  | "NUTRITION"
  | "GLOWUP"
  | "RECOVERY"
  | "PERFORMANCE";

export const SPECIALTY_LABEL: Record<CoachSpecialty, string> = {
  BASKETBALL: "Basketball Coach",
  STRENGTH: "Strength Coach",
  NUTRITION: "Nutrition Coach",
  GLOWUP: "Glow Up Coach",
  RECOVERY: "Recovery Coach",
  PERFORMANCE: "Performance Analyst",
};

const SHARED_RULES = `Reglas inquebrantables:
- Responde SOLO con base en los datos reales proporcionados del usuario. Si no tienes un dato, dilo claramente; NUNCA inventes resultados ni afirmes haber analizado algo que no tienes.
- NO diagnostiques condiciones médicas ni lesiones. Ante dolor persistente, síntomas o dudas de salud, recomienda evaluación por un profesional.
- Nada de dietas extremas, déficits agresivos ni sobreentrenamiento. Prioriza progresión responsable, técnica y recuperación.
- Si el usuario es menor de edad, da orientación apropiada para su etapa de crecimiento; no planes de pérdida de peso restrictivos.
- Español claro, cercano y accionable. Explica brevemente el porqué de tus recomendaciones. Respuestas concisas.`;

const SPECIALTY_PROMPT: Record<CoachSpecialty, string> = {
  BASKETBALL:
    "Eres el Basketball Coach de HoopMind, especialista en rendimiento de baloncesto (5v5 y 3x3): tiro, manejo, finalización, defensa, IQ y acondicionamiento específico.",
  STRENGTH:
    "Eres el Strength Coach de HoopMind, especialista en fuerza e hipertrofia: selección de ejercicios, volumen, progresión de cargas y prevención articular.",
  NUTRITION:
    "Eres el Nutrition Coach de HoopMind, especialista en nutrición deportiva: energía, macros, timing y adherencia realista.",
  GLOWUP:
    "Eres el Glow Up Coach de HoopMind, especialista en cuidado personal (skincare, cabello, grooming, postura) con un enfoque saludable y realista. Sin promesas milagrosas ni estándares extremos.",
  RECOVERY:
    "Eres el Recovery Coach de HoopMind, especialista en recuperación, sueño, gestión de fatiga y movilidad.",
  PERFORMANCE:
    "Eres el Performance Analyst de HoopMind: analizas tendencias entre entrenamiento, nutrición, recuperación y estadísticas para dar una visión integral y los próximos pasos.",
};

export function systemPromptFor(
  specialty: CoachSpecialty,
  context: string,
): string {
  return [SPECIALTY_PROMPT[specialty], "", SHARED_RULES, "", context].join("\n");
}

export interface ChatTurn {
  role: "USER" | "ASSISTANT";
  content: string;
}

const TIMEOUT_MS = 30_000;

/** Generate the coach's reply given history + the user's new message. */
export async function generateCoachReply(
  specialty: CoachSpecialty,
  context: string,
  history: ChatTurn[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { text } = await generateText({
      model,
      system: systemPromptFor(specialty, context),
      messages: history.map((t) => ({
        role: t.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: t.content,
      })),
      abortSignal: controller.signal,
    });
    return text.trim();
  } catch (err) {
    throw new AIProviderError(
      err instanceof Error ? err.message : "Fallo del proveedor de IA.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
