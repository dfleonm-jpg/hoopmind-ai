import "server-only";

import { z } from "zod";
import { generateObject } from "ai";
import { model } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/generate";

export const ReportSchema = z.object({
  summary: z
    .string()
    .min(10)
    .max(400)
    .describe("Resumen motivador de 1-2 frases del rendimiento de la sesión."),
  recommendations: z
    .array(z.string().min(5).max(160))
    .length(2)
    .describe("Exactamente 2 recomendaciones accionables para la próxima sesión."),
});

export type SessionReportContent = z.infer<typeof ReportSchema>;

export interface ReportInputStats {
  todayMade: number;
  todayAttempted: number;
  todayPct: number; // 0..1
  historicalPct: number; // 0..1 (excluding today)
  hotZoneLabel: string | null;
  durationMin: number;
  format: string;
}

const SYSTEM = `Eres un entrenador de baloncesto que escribe un breve reporte post-entrenamiento en español.
Devuelves SOLO el objeto del esquema: un resumen motivador y exactamente 2 recomendaciones accionables y concretas.
Tono profesional y cercano, sin relleno.`;

const TIMEOUT_MS = 20_000;

/** Generate a short post-session report. Falls back to a deterministic report. */
export async function generateSessionReport(
  stats: ReportInputStats,
): Promise<SessionReportContent> {
  const delta = Math.round((stats.todayPct - stats.historicalPct) * 100);
  const prompt = [
    "Datos de la sesión de hoy:",
    `- Tiros: ${stats.todayMade}/${stats.todayAttempted} (${Math.round(stats.todayPct * 100)}%).`,
    `- Promedio histórico: ${Math.round(stats.historicalPct * 100)}% (diferencia hoy: ${delta >= 0 ? "+" : ""}${delta} puntos).`,
    stats.hotZoneLabel ? `- Zona caliente de hoy: ${stats.hotZoneLabel}.` : "- Sin zona destacada hoy.",
    `- Duración: ${stats.durationMin} min. Formato: ${stats.format}.`,
    "Escribe el resumen y 2 recomendaciones para el próximo entrenamiento.",
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { object } = await generateObject({
      model,
      schema: ReportSchema,
      system: SYSTEM,
      prompt,
      abortSignal: controller.signal,
    });
    return object;
  } catch (err) {
    // Report is non-critical: degrade gracefully with a deterministic summary.
    void (err as AIProviderError);
    return fallbackReport(stats, delta);
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackReport(
  stats: ReportInputStats,
  delta: number,
): SessionReportContent {
  const trend =
    delta > 0
      ? `Subiste ${delta} puntos sobre tu promedio.`
      : delta < 0
        ? `Bajaste ${Math.abs(delta)} puntos respecto a tu promedio; es normal, sigue constante.`
        : "Mantuviste tu promedio habitual.";
  return {
    summary: `Sesión completada: ${stats.todayMade}/${stats.todayAttempted} (${Math.round(stats.todayPct * 100)}%). ${trend}`,
    recommendations: [
      stats.hotZoneLabel
        ? `Aprovecha tu buena racha en ${stats.hotZoneLabel} y añade volumen desde tus zonas más frías.`
        : "Registra tus tiros por zona para afinar las recomendaciones.",
      "Repite en 48 h priorizando técnica y repeticiones de calidad sobre cantidad.",
    ],
  };
}
