"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { playCue, unlockAudio } from "@/lib/audio/feedback";
import { ZONE_IDS } from "@/lib/validation/session";

const ZONE_LABELS: Record<string, string> = {
  left_corner_3: "Esq. izq. 3",
  left_wing_3: "Ala izq. 3",
  top_key_3: "Frontal 3",
  right_wing_3: "Ala der. 3",
  right_corner_3: "Esq. der. 3",
  left_mid: "Media izq.",
  center_mid: "Media centro",
  right_mid: "Media der.",
  paint: "Zona",
  free_throw: "Tiro libre",
};

export function ShotCounter({
  made,
  attempted,
  zone,
  onZoneChange,
  onMade,
  onAttempt,
}: {
  made: number;
  attempted: number;
  zone: string;
  onZoneChange: (zone: string) => void;
  onMade: () => void;
  onAttempt: () => void;
}) {
  const pct = attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  function handleMade() {
    unlockAudio();
    playCue("made");
    onMade();
  }
  function handleMiss() {
    unlockAudio();
    playCue("attempt");
    onAttempt();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-xs">Zona de tiro</span>
        <span className="text-sm font-bold tabular-nums">
          <span className="text-fg">{made}/{attempted}</span>
          <span
            className={
              pct >= 50 ? "text-success ml-1.5" : "text-fg-muted ml-1.5"
            }
          >
            {pct}%
          </span>
        </span>
      </div>

      <select
        value={zone}
        onChange={(e) => onZoneChange(e.target.value)}
        aria-label="Zona de tiro"
        className="bg-bg text-fg border-border min-h-touch w-full rounded-xl border px-3 text-base"
      >
        {ZONE_IDS.map((z) => (
          <option key={z} value={z}>
            {ZONE_LABELS[z] ?? z}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          onClick={handleMade}
          className="from-success to-success-dim h-20 bg-gradient-to-b text-lg text-on-accent shadow-[0_8px_28px_-10px_var(--color-success)] active:scale-[0.97]"
          aria-label="Tiro encestado"
        >
          ✓ Encestado
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={handleMiss}
          className="h-20 text-lg"
          aria-label="Tiro fallado"
        >
          ✕ Fallado
        </Button>
      </div>
    </div>
  );
}
