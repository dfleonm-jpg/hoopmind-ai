"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Cycle-by-cycle plyometric visualizer (v4 Fase 6).
 * Animates a stick figure through 4 phases with a force vector:
 *   1. Carga excéntrica → 2. Amortización (<200ms) → 3. Despegue → 4. Aterrizaje
 */
const PHASES = [
  { key: "load", label: "1. Carga excéntrica", hipY: 56, forceLen: 0, color: "var(--color-telemetry)" },
  { key: "amort", label: "2. Amortización < 200ms", hipY: 62, forceLen: 10, color: "var(--color-accent)" },
  { key: "takeoff", label: "3. Despegue explosivo", hipY: 34, forceLen: 34, color: "var(--color-success)" },
  { key: "landing", label: "4. Aterrizaje suave", hipY: 50, forceLen: 14, color: "var(--color-telemetry)" },
] as const;

export function PlyoVisualizerSVG({ contactMs }: { contactMs: number | null }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const durations = [700, Math.min(400, (contactMs ?? 200) + 200), 500, 700];
    const t = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES.length),
      durations[phase] ?? 600,
    );
    return () => clearTimeout(t);
  }, [phase, reduce, contactMs]);

  const p = PHASES[phase]!;
  const hipY = p.hipY;
  // Legs bend more when hips are lower.
  const kneeBend = (62 - hipY) * 0.6;

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 160 120" className="w-full" role="img" aria-label={`Fase: ${p.label}`}>
        {/* ground */}
        <line x1={10} y1={108} x2={150} y2={108} stroke="var(--color-border)" strokeWidth={2} />

        {/* force vector (upward) */}
        <motion.line
          x1={80}
          x2={80}
          y1={108}
          animate={{ y2: 108 - p.forceLen * 1.5 }}
          transition={{ duration: 0.25 }}
          stroke={p.color}
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <defs>
          <marker id="arrow" markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill={p.color} />
          </marker>
        </defs>

        {/* stick figure */}
        <motion.g animate={{ y: hipY - 50 }} transition={{ duration: 0.25 }}>
          <circle cx={80} cy={26} r={8} fill="none" stroke="var(--color-fg)" strokeWidth={2.5} />
          <line x1={80} y1={34} x2={80} y2={62} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          {/* arms */}
          <line x1={80} y1={42} x2={66} y2={54} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={80} y1={42} x2={94} y2={54} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          {/* legs with knee bend */}
          <line x1={80} y1={62} x2={70} y2={82 + kneeBend} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={70} y1={82 + kneeBend} x2={70} y2={100} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={80} y1={62} x2={90} y2={82 + kneeBend} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={90} y1={82 + kneeBend} x2={90} y2={100} stroke="var(--color-fg)" strokeWidth={2.5} strokeLinecap="round" />
        </motion.g>
      </svg>

      {/* phase stepper */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {PHASES.map((ph, i) => (
            <button
              key={ph.key}
              onClick={() => setPhase(i)}
              aria-label={ph.label}
              className={`h-1.5 w-8 rounded-full ${i === phase ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
        <span className="text-fg text-xs font-semibold">{p.label}</span>
      </div>
      {contactMs ? (
        <p className="text-fg-muted text-[11px]">
          Tiempo de contacto objetivo: &lt; {contactMs} ms
        </p>
      ) : null}
    </div>
  );
}
