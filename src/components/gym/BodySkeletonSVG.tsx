"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MuscleGroup } from "@/lib/gym/catalog";

export type RecoveryState = "FRESH" | "WORKED" | "FATIGUED";

export interface MuscleRecovery {
  muscle: MuscleGroup;
  fatigue: number; // 0..1
  state: RecoveryState;
}

interface Region {
  muscle: MuscleGroup;
  /** One or more SVG paths (left/right) for this region in the active view. */
  d: string;
  label: string;
}

/*
 * Anatomically detailed front/back body map. viewBox 0 0 240 520.
 * Paths are hand-tuned to read as real muscle bellies (mirrored L/R where
 * applicable). Centered figure; shoulders at ~y90, hips ~y250, feet ~y500.
 */
const FRONT: Region[] = [
  {
    muscle: "SHOULDERS",
    label: "Hombros",
    d: "M78 108 q-20 0 -28 18 q-4 12 2 22 q14 -14 30 -14 q0 -14 -4 -26z M162 108 q20 0 28 18 q4 12 -2 22 q-14 -14 -30 -14 q0 -14 4 -26z",
  },
  {
    muscle: "CHEST",
    label: "Pecho",
    d: "M86 112 q28 -8 34 2 v34 q-18 10 -38 2 q-8 -24 4 -38z M154 112 q-28 -8 -34 2 v34 q18 10 38 2 q8 -24 -4 -38z",
  },
  {
    muscle: "BICEPS",
    label: "Bíceps",
    d: "M58 150 q-10 24 -6 50 q10 -2 16 -10 q0 -24 -2 -42 q-4 0 -8 2z M182 150 q10 24 6 50 q-10 -2 -16 -10 q0 -24 2 -42 q4 0 8 2z",
  },
  {
    muscle: "FOREARMS",
    label: "Antebrazos",
    d: "M50 202 q-8 28 -4 54 q10 -2 16 -10 q0 -26 -4 -46 q-4 0 -8 2z M190 202 q8 28 4 54 q-10 -2 -16 -10 q0 -26 4 -46 q4 0 8 2z",
  },
  {
    muscle: "CORE",
    label: "Core",
    d: "M98 156 h44 q6 42 -4 76 q-18 10 -36 0 q-10 -34 -4 -76z",
  },
  {
    muscle: "QUADS",
    label: "Cuádriceps",
    d: "M92 252 q-10 58 0 112 q18 8 26 0 q6 -56 2 -110 q-14 -6 -28 -2z M148 252 q10 58 0 112 q-18 8 -26 0 q-6 -56 -2 -110 q14 -6 28 -2z",
  },
  {
    muscle: "CALVES",
    label: "Gemelos",
    d: "M96 372 q-6 48 2 86 q12 4 20 0 q4 -44 0 -86 q-12 -4 -22 0z M144 372 q6 48 -2 86 q-12 4 -20 0 q-4 -44 0 -86 q12 -4 22 0z",
  },
];

const BACK: Region[] = [
  {
    muscle: "SHOULDERS",
    label: "Hombros / Trapecio",
    d: "M78 106 q-20 2 -28 20 q-4 12 2 22 q14 -14 30 -14 q0 -16 -4 -28z M162 106 q20 2 28 20 q4 12 -2 22 q-14 -14 -30 -14 q0 -16 4 -28z M100 100 q20 -8 40 0 q-4 16 -20 18 q-16 -2 -20 -18z",
  },
  {
    muscle: "BACK",
    label: "Espalda / Dorsal",
    d: "M86 122 q34 -6 68 0 q10 50 -6 96 q-28 12 -56 0 q-16 -46 -6 -96z",
  },
  {
    muscle: "TRICEPS",
    label: "Tríceps",
    d: "M58 150 q-10 26 -6 52 q10 -2 16 -12 q0 -24 -2 -42 q-4 0 -8 2z M182 150 q10 26 6 52 q-10 -2 -16 -12 q0 -24 2 -42 q4 0 8 2z",
  },
  {
    muscle: "FOREARMS",
    label: "Antebrazos",
    d: "M50 204 q-8 28 -4 54 q10 -2 16 -10 q0 -26 -4 -46 q-4 0 -8 2z M190 204 q8 28 4 54 q-10 -2 -16 -10 q0 -26 4 -46 q4 0 8 2z",
  },
  {
    muscle: "GLUTES",
    label: "Glúteos",
    d: "M94 228 q24 -8 52 0 q8 22 0 42 q-26 12 -52 0 q-8 -20 0 -42z",
  },
  {
    muscle: "HAMSTRINGS",
    label: "Isquiotibiales",
    d: "M94 276 q-8 52 0 92 q18 8 26 0 q4 -46 0 -92 q-14 -4 -26 0z M146 276 q8 52 0 92 q-18 8 -26 0 q-4 -46 0 -92 q14 -4 26 0z",
  },
  {
    muscle: "CALVES",
    label: "Gemelos",
    d: "M96 376 q-6 46 2 84 q12 4 20 0 q4 -42 0 -84 q-12 -4 -22 0z M144 376 q6 46 -2 84 q-12 4 -20 0 q-4 -42 0 -84 q12 -4 22 0z",
  },
];

const STATE_COLOR: Record<RecoveryState, string> = {
  FRESH: "var(--color-success)",
  WORKED: "var(--color-telemetry)",
  FATIGUED: "var(--color-accent)",
};
const STATE_LABEL: Record<RecoveryState, string> = {
  FRESH: "Fresco · listo",
  WORKED: "Trabajado",
  FATIGUED: "Fatigado · descansa",
};

/** Clean body silhouette outline (head, torso, limbs). */
function Silhouette() {
  return (
    <g fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2.5} strokeLinejoin="round">
      {/* head + neck */}
      <circle cx={120} cy={62} r={30} />
      <path d="M108 90 q12 8 24 0" />
      {/* torso */}
      <path d="M78 106 q42 -18 84 0 q14 72 -4 140 q-38 16 -76 0 q-18 -68 -4 -140z" />
      {/* arms */}
      <path d="M62 120 q-18 44 -12 140" />
      <path d="M178 120 q18 44 12 140" />
      {/* legs */}
      <path d="M92 250 q-10 130 4 212" />
      <path d="M148 250 q10 130 -4 212" />
      {/* feet */}
      <path d="M94 460 q-2 16 2 24 h18 q2 -14 -2 -22" />
      <path d="M146 460 q2 16 -2 24 h-18 q-2 -14 2 -22" />
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
  const reduce = useReducedMotion();
  const [view, setView] = React.useState<"front" | "back">("front");
  const regions = view === "front" ? FRONT : BACK;
  const byMuscle = React.useMemo(
    () => new Map(recovery.map((r) => [r.muscle, r])),
    [recovery],
  );

  function fillFor(m: MuscleGroup): string {
    const rec = byMuscle.get(m);
    if (selected === m) return STATE_COLOR[rec?.state ?? "FRESH"];
    if (!rec || rec.state === "FRESH") return "rgba(255,255,255,0.05)";
    return STATE_COLOR[rec.state];
  }
  function opacityFor(m: MuscleGroup): number {
    const rec = byMuscle.get(m);
    if (selected === m) return 0.92;
    if (!rec || rec.state === "FRESH") return 1;
    return 0.22 + rec.fatigue * 0.5;
  }

  const activeRec = selected ? byMuscle.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Front / back toggle */}
      <div className="bg-card/60 border-border flex rounded-xl border p-1" role="group" aria-label="Vista del cuerpo">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-touch flex-1 rounded-lg text-sm font-semibold transition-colors ${
              view === v ? "bg-accent text-on-accent" : "text-fg-muted hover:text-fg"
            }`}
          >
            {v === "front" ? "Frontal" : "Posterior"}
          </button>
        ))}
      </div>

      <div className="relative">
        {/* ambient glow when a fatigued muscle is selected */}
        {activeRec && activeRec.state !== "FRESH" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl"
            style={{ background: `radial-gradient(circle at 50% 40%, ${STATE_COLOR[activeRec.state]}, transparent 60%)` }}
          />
        ) : null}

        <svg
          viewBox="0 0 240 520"
          className="mx-auto h-auto w-full max-w-[300px]"
          role="group"
          aria-label={`Mapa muscular ${view === "front" ? "frontal" : "posterior"}`}
        >
          <defs>
            <filter id="muscle-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <Silhouette />

          {regions.map((r) => {
            const rec = byMuscle.get(r.muscle);
            const isSelected = selected === r.muscle;
            const pulse = !reduce && rec?.state === "FATIGUED";
            return (
              <motion.path
                key={`${view}-${r.muscle}`}
                d={r.d}
                fill={fillFor(r.muscle)}
                stroke={isSelected ? STATE_COLOR[rec?.state ?? "FRESH"] : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                filter={isSelected || rec?.state === "FATIGUED" ? "url(#muscle-glow)" : undefined}
                style={{ cursor: "pointer" }}
                initial={false}
                animate={{
                  fillOpacity: pulse
                    ? [opacityFor(r.muscle), opacityFor(r.muscle) + 0.18, opacityFor(r.muscle)]
                    : opacityFor(r.muscle),
                }}
                transition={pulse ? { duration: 2.2, repeat: Infinity } : { duration: 0.25 }}
                onClick={() => onSelect(r.muscle)}
                role="button"
                aria-label={`${r.label}${rec ? ` · ${STATE_LABEL[rec.state]}` : ""}`}
              />
            );
          })}
        </svg>
      </div>

      {/* Selected muscle status */}
      {activeRec ? (
        <div
          className="glass flex items-center justify-between rounded-xl px-3 py-2"
          aria-live="polite"
        >
          <span className="text-fg text-sm font-semibold">
            {regions.find((r) => r.muscle === selected)?.label ?? selected}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: STATE_COLOR[activeRec.state] }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: STATE_COLOR[activeRec.state] }} />
            {STATE_LABEL[activeRec.state]} · {Math.round(activeRec.fatigue * 100)}%
          </span>
        </div>
      ) : (
        <p className="text-fg-muted text-center text-xs">
          Toca un músculo para ver su recuperación y filtrar ejercicios.
        </p>
      )}

      {/* Legend */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {(Object.keys(STATE_COLOR) as RecoveryState[]).map((s) => (
          <li key={s} className="text-fg-muted flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATE_COLOR[s] }} />
            {s === "FRESH" ? "Fresco" : s === "WORKED" ? "Trabajado" : "Fatigado"}
          </li>
        ))}
      </ul>
    </div>
  );
}
