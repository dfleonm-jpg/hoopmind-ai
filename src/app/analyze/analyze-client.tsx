"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// Client-only: the pose engine (MediaPipe WASM) must never run during SSR.
const ShotAnalyzer = dynamic(
  () => import("@/components/analyze/ShotAnalyzer").then((m) => m.ShotAnalyzer),
  {
    ssr: false,
    loading: () => <p className="text-fg-muted text-sm">Cargando analizador…</p>,
  },
);

const DribbleAnalyzer = dynamic(
  () =>
    import("@/components/analyze/DribbleAnalyzer").then((m) => m.DribbleAnalyzer),
  {
    ssr: false,
    loading: () => <p className="text-fg-muted text-sm">Cargando analizador…</p>,
  },
);

type Mode = "shot" | "dribble";

export function AnalyzeClient({
  sessionId,
  femurClass,
}: {
  sessionId?: string;
  femurClass?: "LONG_FEMUR" | "BALANCED" | "SHORT_LEVER" | null;
}) {
  const [mode, setMode] = React.useState<Mode>("shot");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Tipo de análisis"
        className="bg-card/60 border-border flex rounded-xl border p-1"
      >
        <Button
          variant={mode === "shot" ? "primary" : "ghost"}
          className="min-h-0 h-10 flex-1 text-sm"
          onClick={() => setMode("shot")}
        >
          Tiro &amp; técnica
        </Button>
        <Button
          variant={mode === "dribble" ? "primary" : "ghost"}
          className="min-h-0 h-10 flex-1 text-sm"
          onClick={() => setMode("dribble")}
        >
          Bote / ball handling
        </Button>
      </div>

      {mode === "shot" ? (
        <ShotAnalyzer sessionId={sessionId} femurClass={femurClass ?? null} />
      ) : (
        <DribbleAnalyzer />
      )}
    </div>
  );
}
