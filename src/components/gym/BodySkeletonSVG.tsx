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
  /** Optional thin interior lines that give the muscle belly definition. */
  detail?: string;
  label: string;
}

/*
 * Anatomically detailed front/back body map. viewBox 0 0 240 520.
 * Styled after a premium "muscle scan" visual: cyan resting musculature on a
 * dark gridded field, with warm orange glow on highlighted groups. Paths are
 * hand-tuned to read as real muscle bellies (mirrored L/R where applicable).
 * Centered figure; shoulders ~y90, hips ~y250, feet ~y500.
 */
const FRONT: Region[] = [
  {
    muscle: "SHOULDERS",
    label: "Hombros",
    d: "M78 108 q-20 0 -28 18 q-4 12 2 22 q14 -14 30 -14 q0 -14 -4 -26z M162 108 q20 0 28 18 q4 12 -2 22 q-14 -14 -30 -14 q0 -14 4 -26z",
    detail: "M60 118 q6 10 14 14 M180 118 q-6 10 -14 14",
  },
  {
    muscle: "CHEST",
    label: "Pecho",
    d: "M86 112 q28 -8 34 2 v34 q-18 10 -38 2 q-8 -24 4 -38z M154 112 q-28 -8 -34 2 v34 q18 10 38 2 q8 -24 -4 -38z",
    detail: "M90 120 q18 -4 28 2 M150 120 q-18 -4 -28 2 M96 134 q14 6 22 2 M144 134 q-14 6 -22 2",
  },
  {
    muscle: "BICEPS",
    label: "Bíceps",
    d: "M58 150 q-10 24 -6 50 q10 -2 16 -10 q0 -24 -2 -42 q-4 0 -8 2z M182 150 q10 24 6 50 q-10 -2 -16 -10 q0 -24 2 -42 q4 0 8 2z",
    detail: "M58 162 q4 20 6 34 M182 162 q-4 20 -6 34",
  },
  {
    muscle: "FOREARMS",
    label: "Antebrazos",
    d: "M50 202 q-8 28 -4 54 q10 -2 16 -10 q0 -26 -4 -46 q-4 0 -8 2z M190 202 q8 28 4 54 q-10 -2 -16 -10 q0 -26 4 -46 q4 0 8 2z",
    detail: "M50 214 q2 22 6 38 M190 214 q-2 22 -6 38",
  },
  {
    muscle: "CORE",
    label: "Core",
    d: "M98 156 h44 q6 42 -4 76 q-18 10 -36 0 q-10 -34 -4 -76z",
    detail: "M120 158 v72 M100 172 h40 M102 188 h36 M104 204 h32",
  },
  {
    muscle: "QUADS",
    label: "Cuádriceps",
    d: "M92 252 q-10 58 0 112 q18 8 26 0 q6 -56 2 -110 q-14 -6 -28 -2z M148 252 q10 58 0 112 q-18 8 -26 0 q-6 -56 -2 -110 q14 -6 28 -2z",
    detail: "M104 258 q-4 52 2 100 M136 258 q4 52 -2 100 M94 300 q10 4 22 2 M146 300 q-10 4 -22 2",
  },
  {
    muscle: "CALVES",
    label: "Gemelos",
    d: "M96 372 q-6 48 2 86 q12 4 20 0 q4 -44 0 -86 q-12 -4 -22 0z M144 372 q6 48 -2 86 q-12 4 -20 0 q-4 -44 0 -86 q12 -4 22 0z",
    detail: "M106 378 q-2 40 2 74 M134 378 q2 40 -2 74",
  },
];

const BACK: Region[] = [
  {
    muscle: "SHOULDERS",
    label: "Hombros / Trapecio",
    d: "M78 106 q-20 2 -28 20 q-4 12 2 22 q14 -14 30 -14 q0 -16 -4 -28z M162 106 q20 2 28 20 q4 12 -2 22 q-14 -14 -30 -14 q0 -16 4 -28z M100 100 q20 -8 40 0 q-4 16 -20 18 q-16 -2 -20 -18z",
    detail: "M120 100 v20 M104 108 q16 6 32 0",
  },
  {
    muscle: "BACK",
    label: "Espalda / Dorsal",
    d: "M86 122 q34 -6 68 0 q10 50 -6 96 q-28 12 -56 0 q-16 -46 -6 -96z",
    detail: "M120 124 v92 M94 140 q26 -6 52 0 M92 168 q28 10 56 0 M98 196 q22 8 44 0",
  },
  {
    muscle: "TRICEPS",
    label: "Tríceps",
    d: "M58 150 q-10 26 -6 52 q10 -2 16 -12 q0 -24 -2 -42 q-4 0 -8 2z M182 150 q10 26 6 52 q-10 -2 -16 -12 q0 -24 2 -42 q4 0 8 2z",
    detail: "M58 164 q4 20 6 34 M182 164 q-4 20 -6 34",
  },
  {
    muscle: "FOREARMS",
    label: "Antebrazos",
    d: "M50 204 q-8 28 -4 54 q10 -2 16 -10 q0 -26 -4 -46 q-4 0 -8 2z M190 204 q8 28 4 54 q-10 -2 -16 -10 q0 -26 4 -46 q4 0 8 2z",
    detail: "M50 216 q2 22 6 38 M190 216 q-2 22 -6 38",
  },
  {
    muscle: "GLUTES",
    label: "Glúteos",
    d: "M94 228 q24 -8 52 0 q8 22 0 42 q-26 12 -52 0 q-8 -20 0 -42z",
    detail: "M120 230 v38 M98 248 q22 8 44 0",
  },
  {
    muscle: "HAMSTRINGS",
    label: "Isquiotibiales",
    d: "M94 276 q-8 52 0 92 q18 8 26 0 q4 -46 0 -92 q-14 -4 -26 0z M146 276 q8 52 0 92 q-18 8 -26 0 q-4 -46 0 -92 q14 -4 26 0z",
    detail: "M106 282 q-2 44 2 82 M134 282 q2 44 -2 82",
  },
  {
    muscle: "CALVES",
    label: "Gemelos",
    d: "M96 376 q-6 46 2 84 q12 4 20 0 q4 -42 0 -84 q-12 -4 -22 0z M144 376 q6 46 -2 84 q-12 4 -20 0 q-4 -42 0 -84 q12 -4 22 0z",
    detail: "M106 382 q-2 38 2 72 M134 382 q2 38 -2 72",
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

/** Resting musculature tint (cyan) — the figure always reads as "muscled". */
const BASE_MUSCLE = "var(--color-telemetry)";

/** Clean body silhouette outline (head, torso, limbs). */
function Silhouette() {
  return (
    <g fill="none" stroke="rgba(76,201,255,0.28)" strokeWidth={2.4} strokeLinejoin="round">
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
  const [hover, setHover] = React.useState<MuscleGroup | null>(null);
  const regions = view === "front" ? FRONT : BACK;
  const byMuscle = React.useMemo(
    () => new Map(recovery.map((r) => [r.muscle, r])),
    [recovery],
  );

  /** Highlight color: selected/worked/fatigued glow in state color, else cyan base. */
  function fillFor(m: MuscleGroup): string {
    const rec = byMuscle.get(m);
    if (selected === m || hover === m) return STATE_COLOR[rec?.state ?? "WORKED"];
    if (!rec || rec.state === "FRESH") return BASE_MUSCLE;
    return STATE_COLOR[rec.state];
  }
  function opacityFor(m: MuscleGroup): number {
    const rec = byMuscle.get(m);
    if (selected === m) return 0.95;
    if (hover === m) return 0.8;
    if (!rec || rec.state === "FRESH") return 0.32; // resting cyan sheen
    return 0.45 + rec.fatigue * 0.45;
  }
  function isLit(m: MuscleGroup): boolean {
    const rec = byMuscle.get(m);
    return selected === m || hover === m || rec?.state === "FATIGUED" || rec?.state === "WORKED";
  }

  const activeRec = selected ? byMuscle.get(selected) : undefined;
  const ambientColor = activeRec
    ? STATE_COLOR[activeRec.state]
    : "var(--color-telemetry)";

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

      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0a0e16] to-[#050507]">
        {/* ambient glow behind the figure */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 opacity-50 blur-3xl transition-colors duration-500"
          style={{ background: `radial-gradient(circle at 50% 38%, ${ambientColor}, transparent 62%)` }}
        />

        <svg
          viewBox="0 0 240 520"
          className="relative mx-auto h-auto w-full max-w-[300px]"
          role="group"
          aria-label={`Mapa muscular ${view === "front" ? "frontal" : "posterior"}`}
        >
          <defs>
            <filter id="muscle-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* cyan sheen gradient for the resting body */}
            <linearGradient id="body-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-telemetry)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-telemetry)" stopOpacity="0.04" />
            </linearGradient>
            {/* subtle reference grid, like the scan backdrop */}
            <pattern id="scan-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0 H0 V24" fill="none" stroke="rgba(76,201,255,0.08)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* gridded backdrop */}
          <rect x="0" y="0" width="240" height="520" fill="url(#scan-grid)" />

          {/* soft body fill so the silhouette reads as a solid, lit figure */}
          <path
            d="M78 106 q42 -18 84 0 q14 72 -4 140 q-38 16 -76 0 q-18 -68 -4 -140z"
            fill="url(#body-sheen)"
          />

          <Silhouette />

          {/* interior definition lines (always on, faint cyan) */}
          <g fill="none" stroke="rgba(76,201,255,0.22)" strokeWidth={1} strokeLinecap="round">
            {regions.map((r) =>
              r.detail ? <path key={`detail-${view}-${r.muscle}`} d={r.detail} /> : null,
            )}
          </g>

          {regions.map((r) => {
            const rec = byMuscle.get(r.muscle);
            const lit = isLit(r.muscle);
            const pulse = !reduce && rec?.state === "FATIGUED";
            return (
              <motion.path
                key={`${view}-${r.muscle}`}
                d={r.d}
                fill={fillFor(r.muscle)}
                stroke={lit ? STATE_COLOR[rec?.state ?? "WORKED"] : "rgba(76,201,255,0.3)"}
                strokeWidth={selected === r.muscle ? 2 : lit ? 1.2 : 0.8}
                filter={lit ? "url(#muscle-glow)" : undefined}
                style={{ cursor: "pointer" }}
                initial={false}
                animate={{
                  fillOpacity: pulse
                    ? [opacityFor(r.muscle), opacityFor(r.muscle) + 0.2, opacityFor(r.muscle)]
                    : opacityFor(r.muscle),
                }}
                transition={pulse ? { duration: 2.2, repeat: Infinity } : { duration: 0.25 }}
                onClick={() => onSelect(r.muscle)}
                onMouseEnter={() => setHover(r.muscle)}
                onMouseLeave={() => setHover((h) => (h === r.muscle ? null : h))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r.muscle);
                  }
                }}
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
