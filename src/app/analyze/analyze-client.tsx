"use client";

import dynamic from "next/dynamic";

// Client-only: the pose engine (MediaPipe WASM) must never run during SSR.
const ShotAnalyzer = dynamic(
  () => import("@/components/analyze/ShotAnalyzer").then((m) => m.ShotAnalyzer),
  {
    ssr: false,
    loading: () => (
      <p className="text-fg-muted text-sm">Cargando analizador…</p>
    ),
  },
);

export function AnalyzeClient({
  sessionId,
  femurClass,
}: {
  sessionId?: string;
  femurClass?: "LONG_FEMUR" | "BALANCED" | "SHORT_LEVER" | null;
}) {
  return <ShotAnalyzer sessionId={sessionId} femurClass={femurClass ?? null} />;
}
