"use client";

import { motion } from "framer-motion";

export interface RingData {
  label: string;
  value: number; // 0..1
  display: string; // text in the center
  color: string; // CSS color
}

function Ring({ data }: { data: RingData }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const pct = Math.min(1, Math.max(0, data.value));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={84} height={84} viewBox="0 0 84 84" aria-hidden>
        <circle
          cx={42}
          cy={42}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={7}
        />
        <motion.circle
          cx={42}
          cy={42}
          r={R}
          fill="none"
          stroke={data.color}
          strokeWidth={7}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <text
          x={42}
          y={46}
          textAnchor="middle"
          fontSize={16}
          fontWeight={800}
          fill="var(--color-fg)"
          className="tabular-nums"
        >
          {data.display}
        </text>
      </svg>
      <span className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
        {data.label}
      </span>
    </div>
  );
}

/** Three telemetry rings: Carga, Tiro, Consistencia. */
export function TelemetryRings({ rings }: { rings: RingData[] }) {
  return (
    <div className="flex items-center justify-around">
      {rings.map((r) => (
        <Ring key={r.label} data={r} />
      ))}
    </div>
  );
}
