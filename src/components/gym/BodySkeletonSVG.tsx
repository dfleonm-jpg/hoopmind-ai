"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { MuscleGroup } from "@/lib/gym/catalog";

export type RecoveryState = "FRESH" | "WORKED" | "FATIGUED";

export interface MuscleRecovery {
  muscle: MuscleGroup;
  fatigue: number; // 0..1
  state: RecoveryState;
}

/**
 * Interactive muscle map built on top of the rendered body illustrations
 * (public/body/body-front.webp and body-back.webp). The photo IS the figure,
 * so it looks exactly like the reference; we overlay tappable glow hotspots
 * positioned over each muscle group. Positions are percentages relative to
 * the image box — the figure sits in the centered vertical band (~37–63% x).
 */

interface Hotspot {
  muscle: MuscleGroup;
  label: string;
  /** Center of the glow as % of the image box. */
  x: number;
  y: number;
  /** Glow radius as % of the box width. */
  r: number;
}

// Figure is centered; torso spine ~x50%, shoulders ~x42/58, feet ~y92%.
const FRONT_SPOTS: Hotspot[] = [
  { muscle: "SHOULDERS", label: "Hombros", x: 42, y: 25, r: 9 },
  { muscle: "SHOULDERS", label: "Hombros", x: 58, y: 25, r: 9 },
  { muscle: "CHEST", label: "Pecho", x: 50, y: 30, r: 12 },
  { muscle: "BICEPS", label: "Bíceps", x: 38, y: 36, r: 7 },
  { muscle: "BICEPS", label: "Bíceps", x: 62, y: 36, r: 7 },
  { muscle: "CORE", label: "Core / Abdomen", x: 50, y: 42, r: 10 },
  { muscle: "FOREARMS", label: "Antebrazos", x: 35, y: 46, r: 6 },
  { muscle: "FOREARMS", label: "Antebrazos", x: 65, y: 46, r: 6 },
  { muscle: "QUADS", label: "Cuádriceps", x: 46, y: 62, r: 8 },
  { muscle: "QUADS", label: "Cuádriceps", x: 54, y: 62, r: 8 },
  { muscle: "CALVES", label: "Gemelos", x: 46, y: 80, r: 7 },
  { muscle: "CALVES", label: "Gemelos", x: 54, y: 80, r: 7 },
];

const BACK_SPOTS: Hotspot[] = [
  { muscle: "SHOULDERS", label: "Hombros / Trapecio", x: 42, y: 24, r: 9 },
  { muscle: "SHOULDERS", label: "Hombros / Trapecio", x: 58, y: 24, r: 9 },
  { muscle: "BACK", label: "Espalda / Dorsal", x: 50, y: 33, r: 12 },
  { muscle: "TRICEPS", label: "Tríceps", x: 38, y: 36, r: 7 },
  { muscle: "TRICEPS", label: "Tríceps", x: 62, y: 36, r: 7 },
  { muscle: "FOREARMS", label: "Antebrazos", x: 35, y: 46, r: 6 },
  { muscle: "FOREARMS", label: "Antebrazos", x: 65, y: 46, r: 6 },
  { muscle: "GLUTES", label: "Glúteos", x: 50, y: 50, r: 11 },
  { muscle: "HAMSTRINGS", label: "Isquiotibiales", x: 46, y: 64, r: 8 },
  { muscle: "HAMSTRINGS", label: "Isquiotibiales", x: 54, y: 64, r: 8 },
  { muscle: "CALVES", label: "Gemelos", x: 46, y: 80, r: 7 },
  { muscle: "CALVES", label: "Gemelos", x: 54, y: 80, r: 7 },
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

const VIEW_IMAGE: Record<"front" | "back", string> = {
  front: "/body/body-front.webp",
  back: "/body/body-back.webp",
};

/** Label shown in the status card for a muscle (view-aware). */
function labelFor(spots: Hotspot[], m: MuscleGroup): string {
  return spots.find((s) => s.muscle === m)?.label ?? m;
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
  const spots = view === "front" ? FRONT_SPOTS : BACK_SPOTS;
  const byMuscle = React.useMemo(
    () => new Map(recovery.map((r) => [r.muscle, r])),
    [recovery],
  );

  /** A muscle glows when selected, hovered, worked or fatigued. */
  function glowColor(m: MuscleGroup): string {
    const rec = byMuscle.get(m);
    if (rec?.state === "FATIGUED") return STATE_COLOR.FATIGUED;
    if (selected === m || hover === m) return STATE_COLOR[rec?.state ?? "WORKED"];
    if (rec?.state === "WORKED") return STATE_COLOR.WORKED;
    return STATE_COLOR.WORKED;
  }
  function glowStrength(m: MuscleGroup): number {
    const rec = byMuscle.get(m);
    if (selected === m) return 0.95;
    if (hover === m) return 0.75;
    if (rec?.state === "FATIGUED") return 0.55 + rec.fatigue * 0.4;
    if (rec?.state === "WORKED") return 0.4 + rec.fatigue * 0.3;
    return 0; // fresh / unknown: no glow, just the illustration
  }

  const activeRec = selected ? byMuscle.get(selected) : undefined;
  const ambientColor = activeRec ? STATE_COLOR[activeRec.state] : "var(--color-telemetry)";

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

      <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/8">
        {/* ambient glow that tints with the selected muscle state */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-40 blur-3xl transition-colors duration-500"
          style={{ background: `radial-gradient(circle at 50% 40%, ${ambientColor}, transparent 60%)` }}
        />

        {/* The body illustration. Aspect box matches the source (1024x572 but
            the figure is a centered vertical band, so we use a tall ratio and
            cover-crop to the figure). */}
        <div className="relative z-[1] aspect-[9/16] w-full">
          <Image
            src={VIEW_IMAGE[view]}
            alt={`Cuerpo — vista ${view === "front" ? "frontal" : "posterior"}`}
            fill
            sizes="(max-width: 640px) 100vw, 340px"
            priority
            className="object-cover object-center"
          />

          {/* Interactive glow hotspots */}
          <div className="absolute inset-0">
            {spots.map((s, i) => {
              const rec = byMuscle.get(s.muscle);
              const strength = glowStrength(s.muscle);
              const color = glowColor(s.muscle);
              const isActive = selected === s.muscle || hover === s.muscle;
              const pulse = !reduce && rec?.state === "FATIGUED";
              const size = `${s.r * 2}%`;
              return (
                <motion.button
                  key={`${view}-${s.muscle}-${i}`}
                  type="button"
                  onClick={() => onSelect(s.muscle)}
                  onMouseEnter={() => setHover(s.muscle)}
                  onMouseLeave={() => setHover((h) => (h === s.muscle ? null : h))}
                  onFocus={() => setHover(s.muscle)}
                  onBlur={() => setHover((h) => (h === s.muscle ? null : h))}
                  aria-label={`${s.label}${rec ? ` · ${STATE_LABEL[rec.state]}` : ""}`}
                  aria-pressed={selected === s.muscle}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: size,
                    paddingBottom: size,
                    minWidth: 28,
                    minHeight: 28,
                  }}
                  initial={false}
                  animate={{
                    opacity: pulse ? [strength, strength + 0.25, strength] : Math.max(strength, isActive ? 0.9 : 0),
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={pulse ? { duration: 2.2, repeat: Infinity } : { duration: 0.25 }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${color} 0%, ${color} 18%, transparent 70%)`,
                      boxShadow: strength > 0 || isActive ? `0 0 16px 2px ${color}` : "none",
                      filter: "blur(1px)",
                    }}
                  />
                  {/* selection ring */}
                  {selected === s.muscle ? (
                    <span
                      aria-hidden
                      className="absolute inset-[22%] rounded-full border-2"
                      style={{ borderColor: color }}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected muscle status */}
      {activeRec ? (
        <div className="glass flex items-center justify-between rounded-xl px-3 py-2" aria-live="polite">
          <span className="text-fg text-sm font-semibold">{labelFor(spots, selected!)}</span>
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
