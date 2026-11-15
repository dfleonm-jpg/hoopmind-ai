"use client";

import * as React from "react";
import { CourtSVG } from "@/components/tactic-board/CourtSVG";
import type { Zone } from "@/lib/court/geometry";

export interface ZoneStat {
  zone: string;
  made: number;
  attempted: number;
  pct: number; // 0..1
}

/** Heatmap fill based on make %, from transparent (no data) to court orange. */
function fillFor(stat: ZoneStat | undefined): string {
  if (!stat || stat.attempted === 0) return "rgba(255,255,255,0.04)";
  // Blend opacity by pct so higher % = more saturated accent.
  const alpha = 0.2 + Math.min(1, stat.pct) * 0.65;
  return `rgba(255, 94, 26, ${alpha.toFixed(2)})`;
}

export function ShotChart({ zones }: { zones: ZoneStat[] }) {
  const byId = React.useMemo(
    () => new Map(zones.map((z) => [z.zone, z])),
    [zones],
  );
  const [active, setActive] = React.useState<string | null>(null);
  const activeStat = active ? byId.get(active) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border overflow-hidden rounded-xl border">
        <CourtSVG
          renderZone={(zone: Zone) => {
            const stat = byId.get(zone.id);
            const selected = active === zone.id;
            return (
              <g key={zone.id}>
                <polygon
                  points={zone.points}
                  fill={fillFor(stat)}
                  stroke={
                    selected ? "var(--color-accent)" : "rgba(255,255,255,0.12)"
                  }
                  strokeWidth={selected ? 3 : 1}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActive(selected ? null : zone.id)}
                  role="button"
                  aria-label={`${zone.label}: ${stat ? `${stat.made} de ${stat.attempted}` : "sin datos"}`}
                />
                {stat && stat.attempted > 0 ? (
                  <text
                    x={zone.centroid.x}
                    y={zone.centroid.y}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                    fill="var(--color-fg)"
                    pointerEvents="none"
                  >
                    {Math.round(stat.pct * 100)}%
                  </text>
                ) : null}
              </g>
            );
          }}
        />
      </div>

      {/* Tooltip / detail for the tapped zone (Req. 7.6) */}
      <div
        className="bg-card border-border min-h-12 rounded-lg border px-3 py-2"
        aria-live="polite"
      >
        {activeStat ? (
          <p className="text-fg text-sm">
            <span className="font-semibold">{zoneLabel(activeStat.zone)}:</span>{" "}
            {activeStat.made}/{activeStat.attempted} ·{" "}
            {Math.round(activeStat.pct * 100)}%
          </p>
        ) : (
          <p className="text-fg-muted text-sm">
            Toca una zona para ver encestados/intentados y porcentaje.
          </p>
        )}
      </div>
    </div>
  );
}

const LABELS: Record<string, string> = {
  left_corner_3: "Esquina izq. (3)",
  left_wing_3: "Ala izq. (3)",
  top_key_3: "Frontal (3)",
  right_wing_3: "Ala der. (3)",
  right_corner_3: "Esquina der. (3)",
  left_mid: "Media izq.",
  center_mid: "Media central",
  right_mid: "Media der.",
  paint: "Zona (pintura)",
  free_throw: "Tiro libre",
};
function zoneLabel(id: string): string {
  return LABELS[id] ?? id;
}
