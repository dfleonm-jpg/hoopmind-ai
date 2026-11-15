"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { ShotAnalysisResult } from "@/lib/pose/types";

/** Ideal ranges for the guided diagnosis (v3). */
const IDEAL = {
  elbow: { min: 85, max: 95, lo: 60, hi: 120 },
  knee: { min: 115, max: 130, lo: 90, hi: 160 },
};

function pctWithin(v: number, lo: number, hi: number): number {
  return Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
}

function Bar({
  label,
  value,
  unit,
  lo,
  hi,
  min,
  max,
}: {
  label: string;
  value: number;
  unit: string;
  lo: number;
  hi: number;
  min: number;
  max: number;
}) {
  const ok = value >= min && value <= max;
  const pos = pctWithin(value, lo, hi);
  const zoneLeft = pctWithin(min, lo, hi);
  const zoneWidth = pctWithin(max, lo, hi) - zoneLeft;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-xs">{label}</span>
        <span
          className={`text-sm font-semibold tabular-nums ${ok ? "text-success" : "text-accent"}`}
        >
          {value}
          {unit}
        </span>
      </div>
      <div className="bg-border relative h-3 w-full overflow-hidden rounded-full">
        {/* ideal zone */}
        <div
          className="bg-success/30 absolute inset-y-0"
          style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
        />
        {/* marker */}
        <div
          className={`absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-full ${ok ? "bg-success" : "bg-accent"}`}
          style={{ left: `calc(${pos}% - 3px)` }}
        />
      </div>
      <span className="text-fg-muted text-[11px]">
        Ideal: {min}–{max}
        {unit}
      </span>
    </div>
  );
}

/** Returns the main mechanical fault + a corrective drill id. */
function diagnose(r: ShotAnalysisResult): {
  fault: string;
  fix: string;
  drillId: string;
} | null {
  if (r.elbowAngle < IDEAL.elbow.min) {
    return {
      fault: "Codo demasiado cerrado en la liberación.",
      fix: "Sube el codo hasta formar una 'L' y apunta al aro; suelta con la muñeca relajada.",
      drillId: "catch_and_shoot_move",
    };
  }
  if (r.elbowAngle > IDEAL.elbow.max) {
    return {
      fault: "Codo demasiado abierto (tiro plano).",
      fix: "Recoge el codo bajo el balón y dale más arco al tiro.",
      drillId: "catch_and_shoot_move",
    };
  }
  if (r.kneeFlexion > IDEAL.knee.max) {
    return {
      fault: "Poca flexión de rodillas: el tiro sale sin piernas.",
      fix: "Carga más abajo para transferir energía desde las piernas al tiro.",
      drillId: "dribble_drive_stepback",
    };
  }
  if (r.kneeFlexion < IDEAL.knee.min) {
    return {
      fault: "Exceso de flexión: pierdes tiempo y equilibrio.",
      fix: "Busca una carga más compacta y una subida más rápida y fluida.",
      drillId: "dribble_drive_stepback",
    };
  }
  return null;
}

export function DiagnosisCard({ result }: { result: ShotAnalysisResult }) {
  // Stability proxy from detection confidence (higher = steadier capture).
  const stability = Math.round(result.confidence * 100);
  const correction = diagnose(result);

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>Diagnóstico biomecánico</CardTitle>

      <div className="flex flex-col gap-3">
        <Bar
          label="Ángulo de codo"
          value={result.elbowAngle}
          unit="°"
          lo={IDEAL.elbow.lo}
          hi={IDEAL.elbow.hi}
          min={IDEAL.elbow.min}
          max={IDEAL.elbow.max}
        />
        <Bar
          label="Flexión de rodillas"
          value={result.kneeFlexion}
          unit="°"
          lo={IDEAL.knee.lo}
          hi={IDEAL.knee.hi}
          min={IDEAL.knee.min}
          max={IDEAL.knee.max}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted text-xs">Liberación</span>
          <span className="text-telemetry font-semibold tabular-nums">
            {result.releaseMs} ms
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted text-xs">Estabilidad</span>
          <span
            className={`font-semibold tabular-nums ${stability >= 70 ? "text-success" : "text-accent"}`}
          >
            {stability}%
          </span>
        </div>
      </div>

      {correction ? (
        <div className="border-accent/40 bg-accent/10 flex flex-col gap-2 rounded-xl border p-3">
          <span className="text-accent text-xs font-semibold tracking-widest uppercase">
            Corrección inmediata
          </span>
          <p className="text-fg text-sm font-medium">{correction.fault}</p>
          <p className="text-fg-muted text-sm">{correction.fix}</p>
          <Link href="/plays">
            <Button variant="secondary" className="mt-1 w-full">
              Practicar drill correctivo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border-success/40 bg-success/10 rounded-xl border p-3">
          <p className="text-success text-sm font-semibold">
            Mecánica dentro de los rangos ideales. ¡Buen tiro!
          </p>
        </div>
      )}
    </Card>
  );
}
