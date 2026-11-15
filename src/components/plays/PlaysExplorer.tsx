"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DRILL_LIST } from "@/lib/drills/presets";
import type { Drill, DrillFormat, DrillStep } from "@/lib/drills/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { TacticBoard } from "@/components/tactic-board/TacticBoard";
import { PlayEditor } from "@/components/tactic-board/PlayEditor";

type Tab = "explore" | "create";
type SituFilter = "ALL" | "FIVE_V_FIVE" | "THREE_X_THREE" | "CLUTCH" | "MINE";

const FILTERS: { value: SituFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "FIVE_V_FIVE", label: "5v5 Set" },
  { value: "THREE_X_THREE", label: "3x3 Rápido" },
  { value: "CLUTCH", label: "Últimos Segundos" },
  { value: "MINE", label: "Mis Jugadas" },
];

const FORMAT_BADGE: Record<DrillFormat, string> = {
  ALL: "5v5 · 3x3",
  FIVE_V_FIVE: "5v5",
  THREE_X_THREE: "3x3",
};

interface CustomPlayApi {
  id: string;
  name: string;
  format: "FIVE_V_FIVE" | "THREE_X_THREE";
  category: string;
  steps: DrillStep[];
  keyCues: string[];
}

/** A play shown in the explorer: preset drill or user play, normalized. */
interface PlayEntry {
  key: string;
  name: string;
  description: string;
  format: DrillFormat;
  category: string;
  isCustom: boolean;
  drill: Drill;
}

function presetToEntry(d: Drill): PlayEntry {
  return {
    key: `preset:${d.id}`,
    name: d.name,
    description: d.description,
    format: d.format,
    category: d.format === "THREE_X_THREE" ? "3x3 Rápido" : "5v5 Set",
    isCustom: false,
    drill: d,
  };
}

function customToEntry(p: CustomPlayApi): PlayEntry {
  // Derive entities from the first move positions; TacticBoard needs entities.
  const entityIds = new Set<string>();
  for (const s of p.steps) for (const m of s.moves) entityIds.add(m.entity);
  const entities = Array.from(entityIds).map((id) => {
    const firstMove = p.steps
      .flatMap((s) => s.moves)
      .find((m) => m.entity === id);
    const start = firstMove?.path[0] ?? { x: 0.5, y: 0.7 };
    const kind = id.startsWith("d")
      ? ("defender" as const)
      : id === "ball"
        ? ("ball" as const)
        : ("player" as const);
    const tag =
      id === "ball" ? undefined : id.replace("o", "").replace("d", "X");
    return { id, kind, start, tag };
  });
  return {
    key: `custom:${p.id}`,
    name: p.name,
    description: p.category,
    format: p.format,
    category: p.category,
    isCustom: true,
    drill: {
      id: "pick_and_roll", // only a React key for the board; not rendered
      name: p.name,
      description: p.category,
      format: p.format,
      keyCues: p.keyCues,
      entities,
      steps: p.steps,
    },
  };
}

function matches(entry: PlayEntry, filter: SituFilter): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "FIVE_V_FIVE":
      return !entry.isCustom && (entry.format === "FIVE_V_FIVE" || entry.format === "ALL");
    case "THREE_X_THREE":
      return !entry.isCustom && (entry.format === "THREE_X_THREE" || entry.format === "ALL");
    case "CLUTCH":
      return /segund|clutch|último|ultimo|final/i.test(entry.category);
    case "MINE":
      return entry.isCustom;
  }
}

export function PlaysExplorer() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("explore");
  const [filter, setFilter] = React.useState<SituFilter>("ALL");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [speed, setSpeed] = React.useState(1);
  const [custom, setCustom] = React.useState<CustomPlayApi[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [reloadKey, setReloadKey] = React.useState(0);
  const loadCustom = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/plays");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { plays: CustomPlayApi[] };
          setCustom(data.plays);
        }
      } catch {
        /* keep existing */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const entries: PlayEntry[] = [
    ...DRILL_LIST.map(presetToEntry),
    ...custom.map(customToEntry),
  ];
  const visible = entries.filter((e) => matches(e, filter));
  const selected = selectedKey
    ? entries.find((e) => e.key === selectedKey) ?? null
    : null;

  async function deletePlay(entry: PlayEntry) {
    const id = entry.key.replace("custom:", "");
    try {
      const res = await fetch(`/api/plays/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Jugada eliminada.", "success");
        setSelectedKey(null);
        void loadCustom();
      } else {
        toast("No se pudo eliminar.", "error");
      }
    } catch {
      toast("Error de red.", "error");
    }
  }

  // --- Create tab ---
  if (tab === "create") {
    return (
      <div className="flex flex-col gap-4">
        <TabBar tab={tab} setTab={setTab} />
        <PlayEditor
          onSaved={() => {
            void loadCustom();
            setTab("explore");
            setFilter("MINE");
          }}
        />
      </div>
    );
  }

  // --- Detail view ---
  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="self-start px-3"
          onClick={() => setSelectedKey(null)}
        >
          ‹ Volver al playbook
        </Button>

        <Card variant="glass">
          <TacticBoard
            key={selected.key}
            drill={selected.drill}
            speed={speed}
            showSpeedControl
            onSpeedChange={setSpeed}
            hideTitle
          />
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>{selected.name}</CardTitle>
          {selected.drill.keyCues.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              {selected.drill.keyCues.map((cue, i) => (
                <li key={i} className="text-fg-muted text-sm">
                  {cue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-fg-muted text-sm">Sin consejos registrados.</p>
          )}
        </Card>

        {selected.isCustom ? (
          <Button variant="ghost" onClick={() => deletePlay(selected)}>
            Eliminar jugada
          </Button>
        ) : null}
      </div>
    );
  }

  // --- Explore catalog ---
  return (
    <div className="flex flex-col gap-4">
      <TabBar tab={tab} setTab={setTab} />

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtros">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "primary" : "secondary"}
            className="min-h-0 h-10 shrink-0 px-3 text-sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <Card className="text-center">
          <p className="text-fg-muted text-sm">
            {filter === "MINE"
              ? 'Aún no has creado jugadas. Usa la pestaña "Crear Jugada".'
              : "No hay jugadas en este filtro."}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((entry) => (
            <li key={entry.key}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedKey(entry.key);
                  setSpeed(1);
                }}
                className="glass hover:border-accent/60 flex w-full flex-col gap-1 rounded-2xl p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg font-semibold">{entry.name}</span>
                  <span className="text-accent text-xs font-semibold">
                    {entry.isCustom ? "Mía" : FORMAT_BADGE[entry.format]}
                  </span>
                </div>
                <span className="text-fg-muted text-sm">{entry.description}</span>
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Modo pizarra"
      className="bg-card border-border flex rounded-xl border p-1"
    >
      <button
        role="tab"
        aria-selected={tab === "explore"}
        onClick={() => setTab("explore")}
        className={`min-h-touch flex-1 rounded-lg text-sm font-semibold transition-colors ${
          tab === "explore" ? "bg-accent text-on-accent" : "text-fg-muted"
        }`}
      >
        Explorar
      </button>
      <button
        role="tab"
        aria-selected={tab === "create"}
        onClick={() => setTab("create")}
        className={`min-h-touch flex-1 rounded-lg text-sm font-semibold transition-colors ${
          tab === "create" ? "bg-accent text-on-accent" : "text-fg-muted"
        }`}
      >
        Crear Jugada
      </button>
    </div>
  );
}
