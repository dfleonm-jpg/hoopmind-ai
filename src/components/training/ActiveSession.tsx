"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Workout } from "@/lib/ai/schema";
import type { DrillId } from "@/lib/drills/types";
import { getDrill } from "@/lib/drills/presets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TacticBoard } from "@/components/tactic-board/TacticBoard";
import { BlockTimer } from "./BlockTimer";
import { ShotCounter } from "./ShotCounter";
import { playCue, toggleMuted } from "@/lib/audio/feedback";
import { sendOrQueue } from "@/lib/offline/sync-queue";

const BLOCK_LABELS: Record<string, string> = {
  WARMUP: "Calentamiento",
  TECHNIQUE: "Técnica",
  FINISHING: "Finalizaciones",
  CONDITIONING: "Acondicionamiento",
  COOLDOWN: "Vuelta a la calma",
};

type ShotKey = string; // `${exIndex}:${zone}`
interface ShotAgg {
  exIndex: number;
  zone: string;
  made: number;
  attempted: number;
}

export function ActiveSession({
  workoutId,
  title,
  content,
  exerciseIds,
}: {
  workoutId: string;
  title: string;
  content: Workout | null;
  /** DB exercise ids indexed [blockIndex][exerciseIndex]. */
  exerciseIds: string[][];
}) {
  const router = useRouter();

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [blockIdx, setBlockIdx] = React.useState(0);
  const [exIdx, setExIdx] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [zone, setZone] = React.useState("free_throw");
  const [muted, setMutedState] = React.useState(false);
  const [showBoard, setShowBoard] = React.useState(false);
  const [finishing, setFinishing] = React.useState(false);

  const [shots, setShots] = React.useState<Record<ShotKey, ShotAgg>>({});
  const startedAtRef = React.useRef<number>(0);

  // Record the session start time once, outside render (lint: no impure calls in render).
  React.useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // Create the session once on mount.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workoutId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { id: string };
        if (active) setSessionId(data.id);
      } catch {
        // Offline: session will be created best-effort on finish.
      }
    })();
    return () => {
      active = false;
    };
  }, [workoutId]);

  if (!content) {
    return (
      <Card className="flex flex-col gap-3">
        <p className="text-fg">No se pudo leer el contenido de la rutina.</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Volver
        </Button>
      </Card>
    );
  }

  const blocks = content.blocks;
  const block = blocks[blockIdx]!;
  const exercise = block.exercises[exIdx]!;
  const globalExIndex = exerciseIds
    .slice(0, blockIdx)
    .reduce((sum, arr) => sum + arr.length, 0) + exIdx;
  const isLastExercise =
    blockIdx === blocks.length - 1 && exIdx === block.exercises.length - 1;

  const currentKey = `${globalExIndex}:${zone}`;
  const currentAgg = shots[currentKey];

  function recordShot(made: boolean) {
    setShots((prev) => {
      const existing =
        prev[currentKey] ??
        { exIndex: globalExIndex, zone, made: 0, attempted: 0 };
      return {
        ...prev,
        [currentKey]: {
          ...existing,
          attempted: existing.attempted + 1,
          made: existing.made + (made ? 1 : 0),
        },
      };
    });
  }

  function nextExercise() {
    if (exIdx < block.exercises.length - 1) {
      setExIdx((i) => i + 1);
    } else if (blockIdx < blocks.length - 1) {
      setBlockIdx((b) => b + 1);
      setExIdx(0);
    }
    setRunning(false);
  }

  function handleBlockTimeUp() {
    if (!muted) playCue("blockEnd");
    setRunning(false);
  }

  async function persistShots(sid: string) {
    const entries = Object.values(shots);
    // Route through the offline queue so writes survive loss of connectivity.
    await Promise.all(
      entries.map((agg) => {
        const exerciseId = resolveExerciseId(exerciseIds, agg.exIndex);
        return sendOrQueue(`/api/sessions/${sid}/shots`, "POST", {
          exerciseId,
          zone: agg.zone,
          made: agg.made,
          attempted: agg.attempted,
        }).catch(() => null);
      }),
    );
  }

  async function finishSession(status: "COMPLETED" | "ABANDONED") {
    setFinishing(true);
    const startedAt = startedAtRef.current || Date.now();
    const realDurationS = Math.round((Date.now() - startedAt) / 1000);
    try {
      let sid = sessionId;
      if (!sid) {
        // Best-effort create if the initial POST failed (offline recovery).
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workoutId }),
        });
        if (res.ok) sid = ((await res.json()) as { id: string }).id;
      }
      if (sid) {
        await persistShots(sid);
        await sendOrQueue(`/api/sessions/${sid}`, "PATCH", {
          status,
          realDurationS,
        });
      }
    } catch {
      // swallow — navigate regardless so the user isn't stuck
    } finally {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const drillId = exercise.drillId as DrillId | null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-accent text-xs font-semibold tracking-widest uppercase">
            {BLOCK_LABELS[block.type] ?? block.type}
          </p>
          <h1 className="text-fg truncate text-xl font-bold">{title}</h1>
        </div>
        <Button
          variant="ghost"
          className="px-3"
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          onClick={() => {
            const m = toggleMuted();
            setMutedState(m);
          }}
        >
          {muted ? "🔇" : "🔊"}
        </Button>
      </div>

      {/* Timer */}
      <Card className="flex flex-col gap-4">
        <BlockTimer
          key={blockIdx}
          durationS={block.durationMin * 60}
          running={running}
          onComplete={handleBlockTimeUp}
        />
        <div className="flex gap-2">
          {running ? (
            <Button variant="secondary" className="flex-1" onClick={() => setRunning(false)}>
              Pausar
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => setRunning(true)}>
              {isLastExercise ? "Reanudar" : "Iniciar"}
            </Button>
          )}
          <Button variant="ghost" className="px-4" onClick={nextExercise} disabled={isLastExercise}>
            Saltar ›
          </Button>
        </div>
      </Card>

      {/* Exercise guide */}
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-fg font-semibold">{exercise.name}</h2>
          <span className="text-fg-muted text-xs">{exercise.reps}</span>
        </div>
        <p className="text-fg-muted text-sm">{exercise.description}</p>
        {drillId ? (
          <Button
            variant="secondary"
            className="mt-1 w-full"
            onClick={() => setShowBoard(true)}
          >
            Ver demostración
          </Button>
        ) : null}
      </Card>

      {/* Shot counter */}
      <Card>
        <ShotCounter
          made={currentAgg?.made ?? 0}
          attempted={currentAgg?.attempted ?? 0}
          zone={zone}
          onZoneChange={setZone}
          onMade={() => recordShot(true)}
          onAttempt={() => recordShot(false)}
        />
      </Card>

      {/* Finish actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          disabled={finishing}
          onClick={() => finishSession("COMPLETED")}
        >
          {finishing ? "Guardando…" : "Finalizar sesión"}
        </Button>
        <Button
          variant="ghost"
          disabled={finishing}
          onClick={() => finishSession("ABANDONED")}
        >
          Abandonar
        </Button>
      </div>

      {/* Tactic board drawer */}
      {showBoard && drillId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowBoard(false)}
        >
          <div
            className="bg-bg border-border max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <Button
                variant="ghost"
                className="px-3"
                aria-label="Cerrar"
                onClick={() => setShowBoard(false)}
              >
                ✕
              </Button>
            </div>
            <TacticBoard drill={getDrill(drillId)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Resolve the DB exercise id from a flattened global exercise index. */
function resolveExerciseId(
  exerciseIds: string[][],
  globalIndex: number,
): string | null {
  let remaining = globalIndex;
  for (const block of exerciseIds) {
    if (remaining < block.length) return block[remaining] ?? null;
    remaining -= block.length;
  }
  return null;
}
