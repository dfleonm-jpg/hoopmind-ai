"use client";

import { Card, CardTitle } from "@/components/ui/card";
import type { ShotAnalysisResult } from "@/lib/pose/types";

export type FormExercise = "SHOT" | "SQUAT" | "HINGE" | "OVERHEAD";

export const FORM_EXERCISES: { v: FormExercise; l: string }[] = [
  { v: "SHOT", l: "Tiro" },
  { v: "SQUAT", l: "Sentadilla" },
  { v: "HINGE", l: "Peso muerto" },
  { v: "OVERHEAD", l: "Press vertical" },
];

export type FemurClass = "LONG_FEMUR" | "BALANCED" | "SHORT_LEVER" | null;

interface Check {
  label: string;
  value: string;
  ok: boolean;
}

/**
 * Interprets the shared pose metrics (elbow/knee angles) per exercise.
 * Adjusts the knee-depth window for long-femur athletes so their natural
 * torso lean / depth isn't penalized. Educational, never a diagnosis.
 */
export function GymFormDiagnosis({
  exercise,
  result,
  femurClass,
}: {
  exercise: FormExercise;
  result: ShotAnalysisResult;
  femurClass: FemurClass;
}) {
  const checks: Check[] = [];
  let correction: string | null = null;

  if (exercise === "SQUAT") {
    // Deeper knee flexion = lower squat. Long femurs may sit a touch higher.
    const minDepth = femurClass === "LONG_FEMUR" ? 70 : 60;
    const kneeOk = result.kneeFlexion <= 100 && result.kneeFlexion >= minDepth - 10;
    checks.push({
      label: "Profundidad (rodilla)",
      value: `${result.kneeFlexion}°`,
      ok: kneeOk,
    });
    if (!kneeOk) {
      correction =
        result.kneeFlexion > 110
          ? "Baja más: busca al menos paralelo manteniendo la espalda neutra."
          : "Controla la bajada; evita rebotar en el fondo.";
    }
    if (femurClass === "LONG_FEMUR") {
      checks.push({
        label: "Palanca femoral",
        value: "Fémur largo",
        ok: true,
      });
    }
  } else if (exercise === "HINGE") {
    // Hinge: knees stay relatively open (less flexion), hips drive back.
    const kneeOk = result.kneeFlexion >= 130;
    checks.push({
      label: "Flexión de rodilla",
      value: `${result.kneeFlexion}°`,
      ok: kneeOk,
    });
    if (!kneeOk) {
      correction =
        "Es una bisagra de cadera, no una sentadilla: lleva la cadera atrás y mantén las rodillas más extendidas.";
    }
  } else if (exercise === "OVERHEAD") {
    // Overhead: elbows should extend near lockout at the top.
    const elbowOk = result.elbowAngle >= 150;
    checks.push({
      label: "Extensión de codo (arriba)",
      value: `${result.elbowAngle}°`,
      ok: elbowOk,
    });
    if (!elbowOk) {
      correction = "Extiende por completo arriba sin bloquear de golpe; apila la barra sobre la cabeza.";
    }
  } else {
    // SHOT: delegate to the standard shooting ranges.
    const elbowOk = result.elbowAngle >= 85 && result.elbowAngle <= 95;
    checks.push({ label: "Ángulo de codo", value: `${result.elbowAngle}°`, ok: elbowOk });
    const kneeOk = result.kneeFlexion >= 115 && result.kneeFlexion <= 130;
    checks.push({ label: "Flexión de rodillas", value: `${result.kneeFlexion}°`, ok: kneeOk });
    if (!elbowOk) correction = "Ajusta el codo hacia ~90° bajo el balón.";
  }

  checks.push({
    label: "Estabilidad",
    value: `${Math.round(result.confidence * 100)}%`,
    ok: result.confidence >= 0.6,
  });

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Form Check</CardTitle>
      <ul className="flex flex-col gap-2">
        {checks.map((c, i) => (
          <li key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
            <span className="text-fg-muted text-sm">{c.label}</span>
            <span className={`text-sm font-semibold tabular-nums ${c.ok ? "text-success" : "text-accent"}`}>
              {c.value} {c.ok ? "✓" : "⚠"}
            </span>
          </li>
        ))}
      </ul>
      {correction ? (
        <div className="border-accent/40 bg-accent/10 rounded-xl border p-3">
          <p className="text-accent text-xs font-semibold tracking-widest uppercase">
            Corrección
          </p>
          <p className="text-fg-muted mt-1 text-sm">{correction}</p>
        </div>
      ) : (
        <div className="border-success/40 bg-success/10 rounded-xl border p-3">
          <p className="text-success text-sm font-semibold">
            Técnica dentro de los rangos para este ejercicio.
          </p>
        </div>
      )}
      <p className="text-fg-muted text-[11px]">
        Observaciones estimadas por análisis de pose, no mediciones médicas ni
        diagnóstico. Ante dolor, consulta a un profesional.
      </p>
    </Card>
  );
}
