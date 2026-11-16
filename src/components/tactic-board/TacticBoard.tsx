"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import type { Drill } from "@/lib/drills/types";
import { Button } from "@/components/ui/button";
import { CourtSVG } from "./CourtSVG";
import { DrillLayer } from "./DrillLayer";
import { Legend } from "./Legend";

type Phase = "idle" | "playing" | "paused" | "done";

export interface TacticBoardProps {
  drill: Drill;
  /** Playback speed multiplier (0.5x / 1x / 1.5x). */
  speed?: number;
  /** Loop continuously and hide controls/legend (landing preview). */
  autoLoop?: boolean;
  /** Hide the title block (when a parent renders its own header). */
  hideTitle?: boolean;
  /** Show the 0.5x/1x/1.5x speed selector. */
  showSpeedControl?: boolean;
  onSpeedChange?: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 1.5] as const;

export function TacticBoard({
  drill,
  speed = 1,
  autoLoop = false,
  hideTitle = false,
  showSpeedControl = false,
  onSpeedChange,
}: TacticBoardProps) {
  const reduce = useReducedMotion();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>(autoLoop ? "playing" : "idle");
  const lastStep = drill.steps.length - 1;
  const step = drill.steps[stepIndex];

  // To switch drills, remount via a `key` prop from the parent (e.g. /plays).
  // That keeps state init clean and avoids a reset-in-effect.

  // When playing, advance after the current step's longest move (scaled by speed).
  React.useEffect(() => {
    if (phase !== "playing" || reduce) return;
    const base =
      Math.max(0, ...(step?.moves.map((m) => m.durationMs) ?? [0])) + 350;
    const dur = base / Math.max(0.25, speed);
    const t = setTimeout(() => {
      setStepIndex((i) => {
        if (i >= lastStep) {
          if (autoLoop) return 0; // loop
          setPhase("done");
          return i;
        }
        return i + 1;
      });
    }, dur);
    return () => clearTimeout(t);
  }, [phase, stepIndex, step, lastStep, reduce, speed, autoLoop]);

  const playing = phase === "playing" && !reduce;

  function play() {
    if (phase === "done") setStepIndex(0);
    setPhase("playing");
  }
  function pause() {
    setPhase("paused");
  }
  function restart() {
    setStepIndex(0);
    setPhase("idle");
  }
  function prev() {
    setPhase("paused");
    setStepIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setPhase("paused");
    setStepIndex((i) => Math.min(lastStep, i + 1));
  }

  // Compact, non-interactive looping preview (landing page).
  if (autoLoop) {
    return (
      <div className="border-border overflow-hidden rounded-xl border">
        <CourtSVG>
          <DrillLayer drill={drill} stepIndex={stepIndex} playing={playing} />
        </CourtSVG>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!hideTitle ? (
        <div>
          <h3 className="text-fg text-lg font-semibold">{drill.name}</h3>
          <p className="text-fg-muted text-sm">{drill.description}</p>
        </div>
      ) : null}

      <div className="border-border overflow-hidden rounded-xl border">
        <CourtSVG>
          <DrillLayer drill={drill} stepIndex={stepIndex} playing={playing} />
        </CourtSVG>
      </div>

      {/* Step caption: always shown when paused / reduced-motion (Req. 4.5, 4.6) */}
      <div
        className="bg-card border-border rounded-lg border px-3 py-2"
        aria-live="polite"
      >
        <p className="text-fg-muted text-xs">
          Paso {stepIndex + 1} de {drill.steps.length}
        </p>
        <p className="text-fg text-sm">{step?.label}</p>
      </div>

      {showSpeedControl ? (
        <div className="flex items-center gap-2" role="group" aria-label="Velocidad">
          <span className="text-fg-muted text-xs">Velocidad</span>
          {SPEEDS.map((s) => (
            <Button
              key={s}
              variant={speed === s ? "primary" : "secondary"}
              className="min-h-touch flex-1 px-2 text-sm"
              onClick={() => onSpeedChange?.(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      ) : null}

      <Legend />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={prev}
          disabled={stepIndex === 0}
          aria-label="Paso anterior"
          className="px-3"
        >
          ‹
        </Button>

        {reduce ? (
          <span className="text-fg-muted flex-1 text-center text-xs">
            Modo sin animación
          </span>
        ) : playing ? (
          <Button onClick={pause} className="flex-1" aria-label="Pausar">
            Pausa
          </Button>
        ) : (
          <Button onClick={play} className="flex-1" aria-label="Reproducir">
            {phase === "done" ? "Repetir" : "Reproducir"}
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={next}
          disabled={stepIndex === lastStep}
          aria-label="Paso siguiente"
          className="px-3"
        >
          ›
        </Button>
        <Button
          variant="ghost"
          onClick={restart}
          aria-label="Reiniciar"
          className="px-3"
        >
          ↺
        </Button>
      </div>
    </div>
  );
}
