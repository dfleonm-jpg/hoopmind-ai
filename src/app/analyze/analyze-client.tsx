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

export function AnalyzeClient({ sessionId }: { sessionId?: string }) {
  return <ShotAnalyzer sessionId={sessionId} />;
}
