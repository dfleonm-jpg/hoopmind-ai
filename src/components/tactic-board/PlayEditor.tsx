"use client";

import * as React from "react";
import { COURT_W, COURT_H } from "@/lib/court/geometry";
import type {
  Drill,
  DrillEntity,
  DrillStep,
  MoveKind,
  Point,
} from "@/lib/drills/types";
import { CourtSVG } from "./CourtSVG";
import { TacticBoard } from "./TacticBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Format = "FIVE_V_FIVE" | "THREE_X_THREE";
type EditorPhase = "layout" | "routes" | "meta" | "preview";

const MOVE_KINDS: { v: MoveKind; l: string }[] = [
  { v: "run", l: "Carrera" },
  { v: "dribble", l: "Drible" },
  { v: "pass", l: "Pase" },
  { v: "shot", l: "Tiro" },
  { v: "screen", l: "Bloqueo" },
];

function defaultEntities(format: Format): DrillEntity[] {
  const n = format === "THREE_X_THREE" ? 3 : 5;
  const offense: DrillEntity[] = Array.from({ length: n }).map((_, i) => ({
    id: `o${i + 1}`,
    kind: "player",
    tag: String(i + 1),
    start: { x: 0.2 + (i * 0.6) / Math.max(1, n - 1), y: 0.72 },
  }));
  const defense: DrillEntity[] = Array.from({ length: n }).map((_, i) => ({
    id: `d${i + 1}`,
    kind: "defender",
    tag: `X${i + 1}`,
    start: { x: 0.25 + (i * 0.5) / Math.max(1, n - 1), y: 0.5 },
  }));
  const ball: DrillEntity = {
    id: "ball",
    kind: "ball",
    start: { x: 0.2, y: 0.72 },
  };
  return [...offense, ...defense, ball];
}

export function PlayEditor({ onSaved }: { onSaved?: () => void }) {
  const { toast } = useToast();
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const [format, setFormat] = React.useState<Format>("FIVE_V_FIVE");
  const [phase, setPhase] = React.useState<EditorPhase>("layout");
  const [entities, setEntities] = React.useState<DrillEntity[]>(() =>
    defaultEntities("FIVE_V_FIVE"),
  );
  const [steps, setSteps] = React.useState<DrillStep[]>([
    { label: "Paso 1", moves: [] },
  ]);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [activeEntity, setActiveEntity] = React.useState<string>("o1");
  const [moveKind, setMoveKind] = React.useState<MoveKind>("run");
  const [draftPath, setDraftPath] = React.useState<Point[]>([]);
  const [dragId, setDragId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("5v5 Set");
  const [cues, setCues] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function changeFormat(f: Format) {
    setFormat(f);
    setEntities(defaultEntities(f));
    setSteps([{ label: "Paso 1", moves: [] }]);
    setStepIdx(0);
    setActiveEntity(f === "THREE_X_THREE" ? "o1" : "o1");
    setDraftPath([]);
    setCategory(f === "THREE_X_THREE" ? "3x3 Rápido" : "5v5 Set");
  }

  function svgPointFromEvent(e: React.PointerEvent): Point | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }

  // Layout phase: drag tokens to set start positions.
  function onPointerDownToken(id: string) {
    if (phase === "layout") setDragId(id);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (phase !== "layout" || !dragId) return;
    const p = svgPointFromEvent(e);
    if (!p) return;
    setEntities((prev) =>
      prev.map((en) => (en.id === dragId ? { ...en, start: p } : en)),
    );
  }
  function onPointerUp() {
    setDragId(null);
  }

  // Routes phase: tap to add points to the draft path.
  function onCourtTap(e: React.PointerEvent) {
    if (phase !== "routes") return;
    const p = svgPointFromEvent(e);
    if (!p) return;
    setDraftPath((prev) => [...prev, p]);
  }

  function commitMove() {
    if (draftPath.length < 2) {
      toast("Traza al menos 2 puntos para el movimiento.", "error");
      return;
    }
    const entity = entities.find((en) => en.id === activeEntity);
    const startPoint = entity?.start ?? draftPath[0]!;
    const fullPath = [startPoint, ...draftPath];
    setSteps((prev) =>
      prev.map((s, i) =>
        i === stepIdx
          ? {
              ...s,
              moves: [
                ...s.moves,
                {
                  entity: activeEntity,
                  kind: moveKind,
                  path: fullPath,
                  durationMs: 1000,
                },
              ],
            }
          : s,
      ),
    );
    setDraftPath([]);
    toast("Movimiento añadido.", "success");
  }

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { label: `Paso ${prev.length + 1}`, moves: [] },
    ]);
    setStepIdx((i) => i + 1);
    setDraftPath([]);
  }

  function setStepLabel(label: string) {
    setSteps((prev) =>
      prev.map((s, i) => (i === stepIdx ? { ...s, label } : s)),
    );
  }

  const previewDrill: Drill = {
    id: "pick_and_roll", // id only used as a key; preview ignores it
    name: name || "Vista previa",
    description: category,
    format,
    keyCues: cues.split("\n").map((c) => c.trim()).filter(Boolean),
    entities,
    steps,
  };

  async function save() {
    const keyCues = cues
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (name.trim().length < 2) {
      toast("Ponle un nombre a la jugada.", "error");
      setPhase("meta");
      return;
    }
    if (steps.every((s) => s.moves.length === 0)) {
      toast("Añade al menos un movimiento.", "error");
      setPhase("routes");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/plays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), format, category, steps, keyCues }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        toast(data?.error?.message ?? "No se pudo guardar la jugada.", "error");
        return;
      }
      toast("Jugada guardada en tu playbook.", "success");
      onSaved?.();
    } catch {
      toast("Error de red al guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const tokenColor = (e: DrillEntity) =>
    e.kind === "defender"
      ? "var(--color-danger)"
      : e.kind === "ball"
        ? "var(--color-fg)"
        : "var(--color-accent)";

  return (
    <div className="flex flex-col gap-4">
      {/* Format + phase tabs */}
      <div className="flex gap-2" role="group" aria-label="Formato">
        {(["FIVE_V_FIVE", "THREE_X_THREE"] as Format[]).map((f) => (
          <Button
            key={f}
            variant={format === f ? "primary" : "secondary"}
            className="flex-1"
            onClick={() => changeFormat(f)}
          >
            {f === "FIVE_V_FIVE" ? "5v5" : "3x3"}
          </Button>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto" role="tablist">
        {(["layout", "routes", "meta", "preview"] as EditorPhase[]).map((p) => (
          <Button
            key={p}
            variant={phase === p ? "primary" : "secondary"}
            className="min-h-0 h-9 flex-1 px-2 text-xs"
            onClick={() => setPhase(p)}
          >
            {p === "layout"
              ? "1. Fichas"
              : p === "routes"
                ? "2. Rutas"
                : p === "meta"
                  ? "3. Datos"
                  : "4. Vista previa"}
          </Button>
        ))}
      </div>

      {phase === "preview" ? (
        <TacticBoard key={`${steps.length}-${format}`} drill={previewDrill} hideTitle />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <CourtSVG
            ref={svgRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerDown={onCourtTap}
            style={{ touchAction: "none" }}
          >
            {/* Draft path being drawn */}
            {phase === "routes" && draftPath.length > 0 ? (
              <polyline
                points={draftPath
                  .map((p) => `${p.x * COURT_W},${p.y * COURT_H}`)
                  .join(" ")}
                fill="none"
                stroke="var(--color-telemetry)"
                strokeWidth={3}
                strokeDasharray="6 5"
              />
            ) : null}

            {/* Tokens */}
            {entities.map((en) => (
              <g
                key={en.id}
                onPointerDown={(ev) => {
                  ev.stopPropagation();
                  onPointerDownToken(en.id);
                }}
                style={{ cursor: phase === "layout" ? "grab" : "default" }}
              >
                <circle
                  cx={en.start.x * COURT_W}
                  cy={en.start.y * COURT_H}
                  r={en.kind === "ball" ? 8 : 14}
                  fill={tokenColor(en)}
                  stroke={
                    activeEntity === en.id ? "var(--color-telemetry)" : "transparent"
                  }
                  strokeWidth={3}
                />
                {en.tag ? (
                  <text
                    x={en.start.x * COURT_W}
                    y={en.start.y * COURT_H + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="var(--color-on-accent)"
                    pointerEvents="none"
                  >
                    {en.tag}
                  </text>
                ) : null}
              </g>
            ))}
          </CourtSVG>
        </div>
      )}

      {/* Phase controls */}
      {phase === "layout" ? (
        <p className="text-fg-muted text-sm">
          Arrastra las fichas (ataque naranja {format === "THREE_X_THREE" ? "1–3" : "1–5"},
          defensa roja X, balón) para colocar la formación inicial.
        </p>
      ) : null}

      {phase === "routes" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-fg-muted text-xs font-semibold tracking-widest uppercase">
              {steps[stepIdx]?.label} · ficha a mover
            </span>
            <div className="flex flex-wrap gap-1.5">
              {entities.map((en) => (
                <Button
                  key={en.id}
                  variant={activeEntity === en.id ? "primary" : "secondary"}
                  className="min-h-0 h-9 px-3 text-xs"
                  onClick={() => setActiveEntity(en.id)}
                >
                  {en.tag ?? "●"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MOVE_KINDS.map((m) => (
              <Button
                key={m.v}
                variant={moveKind === m.v ? "primary" : "secondary"}
                className="min-h-0 h-9 px-3 text-xs"
                onClick={() => setMoveKind(m.v)}
              >
                {m.l}
              </Button>
            ))}
          </div>

          <p className="text-fg-muted text-xs">
            Toca la cancha para trazar la ruta ({draftPath.length} punto(s)).
          </p>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={commitMove}>
              Añadir movimiento
            </Button>
            <Button variant="ghost" onClick={() => setDraftPath([])}>
              Limpiar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="min-h-0 h-9 px-3"
              disabled={stepIdx === 0}
              onClick={() => {
                setStepIdx((i) => Math.max(0, i - 1));
                setDraftPath([]);
              }}
            >
              ‹
            </Button>
            <span className="text-fg-muted flex-1 text-center text-xs">
              Paso {stepIdx + 1} de {steps.length}
            </span>
            <Button
              variant="secondary"
              className="min-h-0 h-9 px-3"
              disabled={stepIdx >= steps.length - 1}
              onClick={() => {
                setStepIdx((i) => Math.min(steps.length - 1, i + 1));
                setDraftPath([]);
              }}
            >
              ›
            </Button>
            <Button className="min-h-0 h-9 px-3" onClick={addStep}>
              + Paso
            </Button>
          </div>

          <Input
            label="Descripción del paso"
            value={steps[stepIdx]?.label ?? ""}
            onChange={(e) => setStepLabel(e.target.value)}
          />
        </div>
      ) : null}

      {phase === "meta" ? (
        <div className="flex flex-col gap-3">
          <Input
            label="Nombre de la jugada"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. PnR lado fuerte"
          />
          <Input
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="5v5 Set / 3x3 Rápido / Últimos Segundos"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-fg text-sm font-medium">
              Consejos clave (uno por línea, máx. 6)
            </span>
            <textarea
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              rows={4}
              className="bg-bg text-fg border-border rounded-xl border px-3 py-2 text-base"
            />
          </label>
        </div>
      ) : null}

      <Button size="lg" disabled={saving} onClick={save}>
        {saving ? "Guardando…" : "Guardar en mi playbook"}
      </Button>
    </div>
  );
}
