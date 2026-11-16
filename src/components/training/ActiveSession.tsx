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
import { ShotClock } from "./ShotClock";
import { playCue, toggleMuted } from "@/lib/audio/feedback";
import { speak, setVoiceEnabled, cancelVoice } from "@/lib/audio/voice";
import {
  isVoiceInputSupported,
  startVoiceShotLogging,
} from "@/lib/audio/voice-input";
import { sendOrQueue } from "@/lib/offline/sync-queue";
import { useToast } from "@/components/ui/toast";

interface SessionReportData {
  summary: string;
  recommendations: string[];
  xpEarned: number;
  level: number;
}

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
  const { toast } = useToast();

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

  // Post-session report (v2) + on-court exercise swap (v2).
  const [report, setReport] = React.useState<SessionReportData | null>(null);
  const [swapping, setSwapping] = React.useState(false);
  const [swapOverride, setSwapOverride] = React.useState<
    Record<string, { name: string; description: string; reps: string }>
  >({});

  // Coach voice + hands-free voice logging + shot clock (v3).
  const [voiceOn, setVoiceOn] = React.useState(true);
  const [listening, setListening] = React.useState(false);
  const [showShotClock, setShowShotClock] = React.useState(false);
  const stopListenRef = React.useRef<(() => void) | null>(null);
  const voiceInputSupported = isVoiceInputSupported();
  // Current (exercise index, zone) for voice input, kept fresh via an effect.
  const shotCtxRef = React.useRef<{ exIndex: number; zone: string }>({
    exIndex: 0,
    zone: "free_throw",
  });

  // Keep the voice-input shot context in sync (no refs touched during render).
  React.useEffect(() => {
    const exIndex =
      exerciseIds.slice(0, blockIdx).reduce((sum, arr) => sum + arr.length, 0) +
      exIdx;
    shotCtxRef.current = { exIndex, zone };
  }, [blockIdx, exIdx, zone, exerciseIds]);

  // Apply a shot from any source (buttons or voice) using the live context.
  const applyShot = React.useCallback((made: boolean) => {
    const { exIndex, zone: z } = shotCtxRef.current;
    const key = `${exIndex}:${z}`;
    setShots((prev) => {
      const existing = prev[key] ?? { exIndex, zone: z, made: 0, attempted: 0 };
      return {
        ...prev,
        [key]: {
          ...existing,
          attempted: existing.attempted + 1,
          made: existing.made + (made ? 1 : 0),
        },
      };
    });
  }, []);

  // Record the session start time once, outside render (lint: no impure calls in render).
  React.useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // Announce the current block/exercise with the coach voice on change (v3).
  React.useEffect(() => {
    if (!content || !voiceOn) return;
    const b = content.blocks[blockIdx];
    const ex = b?.exercises[exIdx];
    if (!b || !ex) return;
    const blockName = BLOCK_LABELS[b.type] ?? b.type;
    speak(`${blockName}. ${ex.name}.`, { interrupt: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockIdx, exIdx, voiceOn]);

  // Stop listening + cancel voice on unmount.
  React.useEffect(() => {
    return () => {
      stopListenRef.current?.();
      cancelVoice();
    };
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

  // Post-session report screen (v2 Block 2): shown after a completed session.
  if (report) {
    return (
      <div className="flex flex-col gap-4">
        <Card variant="glass" className="flex flex-col items-center gap-2 text-center">
          <span className="text-accent text-xs font-semibold tracking-widest uppercase">
            Reporte de sesión
          </span>
          <div className="text-success text-4xl font-extrabold tabular-nums">
            +{report.xpEarned} XP
          </div>
          <p className="text-fg-muted text-sm">Nivel {report.level}</p>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="text-fg font-semibold">Resumen</h2>
          <p className="text-fg-muted text-sm">{report.summary}</p>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="text-fg font-semibold">Para la próxima</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {report.recommendations.map((r, i) => (
              <li key={i} className="text-fg-muted text-sm">
                {r}
              </li>
            ))}
          </ul>
        </Card>

        <Button
          size="lg"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        >
          Volver al inicio
        </Button>
      </div>
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
    applyShot(made);
  }

  function toggleVoiceCoach() {
    const next = !voiceOn;
    setVoiceOn(next);
    setVoiceEnabled(next);
    if (!next) cancelVoice();
  }

  function toggleListening() {
    if (listening) {
      stopListenRef.current?.();
      stopListenRef.current = null;
      setListening(false);
      return;
    }
    const stop = startVoiceShotLogging((word) => {
      applyShot(word === "made");
      playCue(word === "made" ? "made" : "attempt");
    });
    if (!stop) {
      toast("El reconocimiento de voz no está disponible.", "error");
      return;
    }
    stopListenRef.current = stop;
    setListening(true);
    toast('Di "encestado" o "fallado".', "info");
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
    const online = typeof navigator === "undefined" || navigator.onLine;
    try {
      let sid = sessionId;
      if (!sid) {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workoutId }),
        });
        if (res.ok) sid = ((await res.json()) as { id: string }).id;
      }

      if (sid) {
        await persistShots(sid);

        // Online COMPLETED: direct PATCH to capture the AI report + XP.
        if (status === "COMPLETED" && online) {
          const res = await fetch(`/api/sessions/${sid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, realDurationS }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              report?: SessionReportData | null;
            };
            if (data.report) {
              setReport(data.report);
              setFinishing(false);
              return; // show the report screen before navigating
            }
          }
        } else {
          // Abandon or offline: queue it so it syncs later.
          await sendOrQueue(`/api/sessions/${sid}`, "PATCH", {
            status,
            realDurationS,
          });
          if (!online) toast("Sin conexión: se sincronizará al reconectar.", "info");
        }
      }
    } catch {
      // swallow — navigate regardless so the user isn't stuck
    } finally {
      if (!report) {
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  async function swapExercise() {
    setSwapping(true);
    try {
      const res = await fetch(`/api/workouts/${workoutId}/swap-exercise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: block.type,
          durationMin: block.durationMin,
          currentExerciseName: exercise.name,
          reason: "other",
        }),
      });
      if (!res.ok) {
        toast("No se pudo cambiar el ejercicio.", "error");
        return;
      }
      const data = (await res.json()) as {
        exercise: { name: string; description: string; reps: string };
      };
      setSwapOverride((prev) => ({
        ...prev,
        [`${blockIdx}:${exIdx}`]: {
          name: data.exercise.name,
          description: data.exercise.description,
          reps: data.exercise.reps,
        },
      }));
      toast("Ejercicio cambiado.", "success");
    } catch {
      toast("Error de red al cambiar el ejercicio.", "error");
    } finally {
      setSwapping(false);
    }
  }

  const drillId = exercise.drillId as DrillId | null;
  const override = swapOverride[`${blockIdx}:${exIdx}`];
  const shownExercise = override ?? {
    name: exercise.name,
    description: exercise.description,
    reps: exercise.reps,
  };

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
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            className="px-3"
            aria-label={voiceOn ? "Silenciar voz del entrenador" : "Activar voz del entrenador"}
            aria-pressed={voiceOn}
            onClick={toggleVoiceCoach}
          >
            {voiceOn ? "🗣️" : "🤐"}
          </Button>
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
      </div>

      {/* Shot clock toggle */}
      <Button
        variant={showShotClock ? "primary" : "secondary"}
        className="w-full"
        onClick={() => setShowShotClock((v) => !v)}
      >
        {showShotClock ? "Ocultar reloj de posesión" : "Reloj de posesión (24s/12s)"}
      </Button>
      {showShotClock ? (
        <Card className="flex flex-col gap-2">
          <ShotClock muted={muted} />
        </Card>
      ) : null}

      {/* Timer */}
      <Card className="flex flex-col gap-4">
        <BlockTimer
          key={blockIdx}
          durationS={block.durationMin * 60}
          running={running}
          onComplete={handleBlockTimeUp}
          onHalf={() => {
            if (voiceOn) speak("Mitad del bloque. Mantén la intensidad.");
          }}
          onCountdown={(s) => {
            if (voiceOn) speak(String(s), { interrupt: true });
          }}
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-fg font-semibold">{shownExercise.name}</h2>
          <span className="text-fg-muted shrink-0 text-xs">
            {shownExercise.reps}
          </span>
        </div>
        <p className="text-fg-muted text-sm">{shownExercise.description}</p>
        <div className="mt-1 flex gap-2">
          {drillId ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowBoard(true)}
            >
              Ver demostración
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="flex-1"
            disabled={swapping}
            onClick={swapExercise}
          >
            {swapping ? "Cambiando…" : "Cambiar ejercicio"}
          </Button>
        </div>
      </Card>

      {/* Shot counter */}
      <Card className="flex flex-col gap-3">
        <ShotCounter
          made={currentAgg?.made ?? 0}
          attempted={currentAgg?.attempted ?? 0}
          zone={zone}
          onZoneChange={setZone}
          onMade={() => recordShot(true)}
          onAttempt={() => recordShot(false)}
        />
        {voiceInputSupported ? (
          <Button
            variant={listening ? "primary" : "secondary"}
            className="w-full"
            onClick={toggleListening}
            aria-pressed={listening}
          >
            {listening ? "🎙️ Escuchando… (tocar para parar)" : "🎙️ Registrar por voz"}
          </Button>
        ) : null}
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
