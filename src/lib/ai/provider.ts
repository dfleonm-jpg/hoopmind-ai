import "server-only";

import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/**
 * AI provider selection. Groq is the primary provider (AI_PROVIDER="groq").
 * The rest of the app stays provider-agnostic by importing `model` from here.
 */
const AI_PROVIDER = process.env.AI_PROVIDER ?? "groq";

/**
 * Default Groq model. `llama-3.3-70b-versatile` was decommissioned by Groq
 * (Aug 2026); the current production text model with strong structured-output
 * support is `openai/gpt-oss-120b`. Override with GROQ_MODEL if needed.
 */
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

function buildModel(): LanguageModel {
  switch (AI_PROVIDER) {
    case "groq": {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      return groq(GROQ_MODEL);
    }
    default:
      throw new Error(`Proveedor de IA no soportado: ${AI_PROVIDER}`);
  }
}

export const model: LanguageModel = buildModel();
export const providerName = AI_PROVIDER;
export const modelName = GROQ_MODEL;
