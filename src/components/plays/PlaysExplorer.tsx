"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DRILL_LIST } from "@/lib/drills/presets";
import type { DrillFormat, DrillId } from "@/lib/drills/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TacticBoard } from "@/components/tactic-board/TacticBoard";

type FilterValue = "ALL" | "FIVE_V_FIVE" | "THREE_X_THREE";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "FIVE_V_FIVE", label: "5v5" },
  { value: "THREE_X_THREE", label: "3x3" },
];

const FORMAT_BADGE: Record<DrillFormat, string> = {
  ALL: "5v5 · 3x3",
  FIVE_V_FIVE: "5v5",
  THREE_X_THREE: "3x3",
};

function matchesFilter(format: DrillFormat, filter: FilterValue): boolean {
  if (filter === "ALL") return true;
  return format === "ALL" || format === filter;
}

export function PlaysExplorer() {
  const [filter, setFilter] = React.useState<FilterValue>("ALL");
  const [selectedId, setSelectedId] = React.useState<DrillId | null>(null);
  const [speed, setSpeed] = React.useState(1);

  const visible = DRILL_LIST.filter((d) => matchesFilter(d.format, filter));
  const selected = selectedId
    ? DRILL_LIST.find((d) => d.id === selectedId) ?? null
    : null;

  // Detail view for a selected play.
  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="self-start px-3"
          onClick={() => setSelectedId(null)}
        >
          ‹ Todas las jugadas
        </Button>

        <Card variant="glass">
          <TacticBoard
            key={selected.id}
            drill={selected}
            speed={speed}
            showSpeedControl
            onSpeedChange={setSpeed}
          />
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>Consejos de ejecución</CardTitle>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {selected.keyCues.map((cue, i) => (
              <li key={i} className="text-fg-muted text-sm">
                {cue}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  // Catalog grid.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Filtrar por formato">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "primary" : "secondary"}
            className="flex-1"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {visible.map((drill) => (
          <li key={drill.id}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedId(drill.id);
                setSpeed(1);
              }}
              className="glass hover:border-accent/60 flex w-full flex-col gap-1 rounded-2xl p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-fg font-semibold">{drill.name}</span>
                <span className="text-accent text-xs font-semibold">
                  {FORMAT_BADGE[drill.format]}
                </span>
              </div>
              <span className="text-fg-muted text-sm">{drill.description}</span>
            </motion.button>
          </li>
        ))}
      </ul>
    </div>
  );
}
