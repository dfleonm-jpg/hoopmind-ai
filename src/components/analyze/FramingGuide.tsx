"use client";

/**
 * Semi-transparent side-profile silhouette to help the player stand at the
 * right distance and angle before recording (v3).
 */
export function FramingGuide() {
  return (
    <svg
      viewBox="0 0 200 360"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <g
        fill="none"
        stroke="var(--color-telemetry)"
        strokeWidth={2.5}
        strokeOpacity={0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Head */}
        <circle cx={100} cy={48} r={22} />
        {/* Torso */}
        <path d="M100 70 L100 190" />
        {/* Shooting arm (set point) */}
        <path d="M100 100 L128 120 L120 86" />
        {/* Off arm */}
        <path d="M100 104 L78 126" />
        {/* Legs with flexion */}
        <path d="M100 190 L84 252 L84 318" />
        <path d="M100 190 L118 250 L120 318" />
        {/* Ground line */}
        <path d="M50 320 L150 320" strokeDasharray="6 8" />
      </g>
      <text
        x={100}
        y={344}
        textAnchor="middle"
        fontSize={11}
        fill="var(--color-telemetry)"
        fillOpacity={0.7}
      >
        Colócate de perfil dentro de la silueta
      </text>
    </svg>
  );
}
