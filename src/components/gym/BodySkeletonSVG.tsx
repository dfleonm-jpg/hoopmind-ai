"use client";

import * as React from "react";
import type { MuscleGroup } from "@/lib/gym/catalog";

export type RecoveryState = "FRESH" | "WORKED" | "FATIGUED";

export interface MuscleRecovery {
  muscle: MuscleGroup;
  fatigue: number; // 0..1
  state: RecoveryState;
}

interface Region {
  muscle: MuscleGroup;
  /** SVG path for the region on the active view. */
  d: string;
}

// Simplified anatomical regions. viewBox 0 0 200 420. Front and back views.
const FRONT: Region[] = [
  { muscle: "SHOULDERS", d: "M62 96 q-16 2 -20 18 q14 -6 24 -4 z M138 96 q16 2 20 18 q-14 -6 -24 -4 z" },
  { muscle: "CHEST", d: "M74 100 h52 q6 20 -4 34 q-22 8 -44 0 q-10 -14 -4 -34 z" },
  { muscle: "BICEPS", d: "M52 118 q-8 20 -4 42 q10 -2 14 -10 q-2 -20 -2 -34 z M148 118 q8 20 4 42 q-10 -2 -14 -10 q2 -20 2 -34 z" },
  { muscle: "FOREARMS", d: "M44 162 q-6 24 -4 44 q10 -2 14 -8 q0 -22 -2 -40 z M156 162 q6 24 4 44 q-10 -2 -14 -8 q0 -22 2 -40 z" },
  { muscle: "CORE", d: "M80 136 h40 q4 34 -2 58 q-18 8 -36 0 q-6 -24 -2 -58 z" },
  { muscle: "QUADS", d: "M74 200 q-6 50 2 92 q16 6 22 0 q2 -46 0 -92 z M126 200 q6 50 -2 92 q-16 6 -22 0 q-2 -46 0 -92 z" },
  { muscle: "CALVES", d: "M80 300 q-4 40 2 70 q10 4 16 0 q2 -36 0 -70 z M120 300 q4 40 -2 70 q-10 4 -16 0 q-2 -36 0 -70 z" },
];

const BACK: Region[] = [
  { muscle: "SHOULDERS", d: "M62 96 q-16 2 -20 18 q14 -6 24 -4 z M138 96 q16 2 20 18 q-14 -6 -24 -4 z" },
  { muscle: "BACK", d: "M74 100 h52 q8 46 -4 82 q-22 8 -44 0 q-12 -36 -4 -82 z" },
  { muscle: "TRICEPS", d: "M52 118 q-8 20 -4 42 q10 -2 14 -10 q-2 -20 -2 -34 z M148 118 q8 20 4 42 q-10 -2 -14 -10 q2 -20 2 -34 z" },
  { muscle: "FOREARMS", d: "M44 162 q-6 24 -4 44 q10 -2 14 -8 q0 -22 -2 -40 z M156 162 q6 24 4 44 q-10 -2 -14 -8 q0 -22 2 -40 z" },
  { muscle: "GLUTES", d: "M78 190 h44 q6 20 0 34 q-22 10 -44 0 q-6 -14 0 -34 z" },
  { muscle: "HAMSTRINGS", d: "M76 226 q-4 44 2 74 q14 6 20 0 q2 -38 0 -74 z M124 226 q4 44 -2 74 q-14 6 -20 0 q-2 -38 0 -74 z" },
  { muscle: "CALVES", d: "M80 304 q-4 38 2 66 q10 4 16 0 q2 -34 0 -66 z M120 304 q4 38 -2 66 q-10 4 -16 0 q-2 -34 0 -66 z" },
];

const STATE_COLOR: Record<RecoveryState, string> = {
  FRESH: "var(--color-success)",
  WORKED: "var(--color-telemetry)",
  FATIGUED: "var(--color-accent)",
};

/** Body silhouette outline (neutral), same for both views. */
function Silhouette() {
  return (
    <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2}>
      <circle cx={100} cy={56} r={26} />
      <path d="M62 96 q38 -16 76 0 q10 60 -4 110 q-34 14 -68 0 q-14 -50 -4 -110 z" />
      <path d="M48 116 q-14 46 -8 92" />
      <path d="M152 116 q14 46 8 92" />
      <path d="M74 200 q-8 100 4 172" />
      <path d="M126 200 q8 100 -4 172" />
    </g>
  );
}

export function BodySkeletonSVG({
  recovery,
  selected,
  onSelect,
}: {
  recovery: MuscleRecovery[];
  selected: MuscleGroup | null;
  onSelect: (m: MuscleGroup) => void;
}) {
  const [view, setView] = React.useState<"front" | "back">("front");
  const regions = view === "front" ? FRONT : BACK;
  const byMuscle = React.useMemo(
    () => new Map(recovery.map((r) => [r.muscle, r])),
    [recovery],
  );

  function fillFor(m: MuscleGroup): string {
    if (selected === m) return STATE_COLOR[byMuscle.get(m)?.state ?? "FRESH"];
    const rec = byMuscle.get(m);
    if (!rec || rec.state === "FRESH") return "rgba(255,255,255,0.06)";
    // Tint by fatigue even when not selected.
    const base = STATE_COLOR[rec.state];
    return base;
  }

  function opacityFor(m: MuscleGroup): number {
    if (selected === m) return 0.9;
    const rec = byMuscle.get(m);
    if (!rec || rec.state === "FRESH") return 1;
    return 0.25 + rec.fatigue * 0.45;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2" role="group" aria-label="Vista del cuerpo">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-touch flex-1 rounded-xl border text-sm font-semibold transition-colors ${
              view === v
                ? "bg-accent text-on-accent border-accent"
                : "bg-card text-fg-muted border-border"
            }`}
          >
            {v === "front" ? "Frontal" : "Posterior"}
          </button>
        ))}
      </div>

      <svg
        viewBox="0 0 200 420"
        className="mx-auto h-auto w-full max-w-[260px]"
        role="group"
        aria-label={`Mapa muscular ${view === "front" ? "frontal" : "posterior"}`}
      >
        <Silhouette />
        {regions.map((r) => {
          const rec = byMuscle.get(r.muscle);
          return (
            <path
              key={`${view}-${r.muscle}`}
              d={r.d}
              fill={fillFor(r.muscle)}
              fillOpacity={opacityFor(r.muscle)}
              stroke={selected === r.muscle ? STATE_COLOR[rec?.state ?? "FRESH"] : "transparent"}
              strokeWidth={selected === r.muscle ? 2.5 : 0}
              style={{ cursor: "pointer", transition: "fill-opacity 0.2s" }}
              onClick={() => onSelect(r.muscle)}
              role="button"
              aria-label={`${r.muscle}${rec ? ` · ${rec.state}` : ""}`}
            />
          );
        })}
      </svg>

      {/* Recovery legend */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {(
          [
            ["FRESH", "Fresco"],
            ["WORKED", "Trabajado"],
            ["FATIGUED", "Fatigado"],
          ] as [RecoveryState, string][]
        ).map(([s, label]) => (
          <li key={s} className="text-fg-muted flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STATE_COLOR[s] }}
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
