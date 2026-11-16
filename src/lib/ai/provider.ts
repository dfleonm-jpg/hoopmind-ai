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

/**
 * Vision model. `openai/gpt-oss-120b` is text-only, so multimodal tasks
 * (e.g. the meal-photo calorie estimator) use Groq's Llama 4 Scout, which
 * natively accepts text + image inputs. Override with GROQ_VISION_MODEL.
 */
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

function buildModel(modelId: string): LanguageModel {
  switch (AI_PROVIDER) {
    case "groq": {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      return groq(modelId);
    }
    default:
      throw new Error(`Proveedor de IA no soportado: ${AI_PROVIDER}`);
  }
}

export const model: LanguageModel = buildModel(GROQ_MODEL);
export const visionModel: LanguageModel = buildModel(GROQ_VISION_MODEL);
export const providerName = AI_PROVIDER;
export const modelName = GROQ_MODEL;
export const visionModelName = GROQ_VISION_MODEL;
