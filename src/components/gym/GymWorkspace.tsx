"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  BodySkeletonSVG,
  type MuscleRecovery,
} from "@/components/gym/BodySkeletonSVG";
import { RestTimer } from "@/components/gym/RestTimer";
import type { MuscleGroup } from "@/lib/gym/catalog";

interface ApiExercise {
  id: string;
  slug: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  level: string;
  jointImpact: string;
  equipment: string;
  execution: string;
  commonMistakes: string[];
  variations: string[];
  defaultSets: number;
  defaultRepsLow: number;
  defaultRepsHigh: number;
  restSeconds: number;
}

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  SHOULDERS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  FOREARMS: "Antebrazos",
  CORE: "Core",
  QUADS: "Cuádriceps",
  HAMSTRINGS: "Isquios",
  GLUTES: "Glúteos",
  CALVES: "Gemelos",
};

const IMPACT_LABEL: Record<string, string> = {
  LOW: "Impacto articular bajo",
  MEDIUM: "Impacto articular medio",
  HIGH: "Impacto articular alto",
};

export function GymWorkspace() {
  const { toast } = useToast();
  const [recovery, setRecovery] = React.useState<MuscleRecovery[]>([]);
  const [selected, setSelected] = React.useState<MuscleGroup | null>(null);
  const [exercises, setExercises] = React.useState<ApiExercise[]>([]);
  const [loadingEx, setLoadingEx] = React.useState(false);
  const [openEx, setOpenEx] = React.useState<ApiExercise | null>(null);

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [reloadRecovery, setReloadRecovery] = React.useState(0);

  // Load recovery map.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/gym/recovery");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { muscles: MuscleRecovery[] };
          setRecovery(data.muscles);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadRecovery]);

  // Load exercises when a muscle is selected.
  React.useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    void (async () => {
      setLoadingEx(true);
      try {
        const res = await fetch(`/api/gym/exercises?muscle=${selected}`);
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { exercises: ApiExercise[] };
          setExercises(data.exercises);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingEx(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Exercises shown only when a muscle is selected (no eager clear needed).
  const shownExercises = selected ? exercises : [];

  async function startSession() {
    if (!selected) return;
    try {
      const res = await fetch("/api/gym/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Sesión ${MUSCLE_LABEL[selected]}`,
          focus: [selected],
        }),
      });
      if (!res.ok) {
        toast("No se pudo iniciar la sesión.", "error");
        return;
      }
      const data = (await res.json()) as { id: string };
      setSessionId(data.id);
      toast("Sesión iniciada. Registra tus series.", "success");
    } catch {
      toast("Error de red.", "error");
    }
  }

  async function finishSession() {
    if (!sessionId) return;
    try {
      await fetch(`/api/gym/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endedAt: true }),
      });
    } catch {
      /* ignore */
    }
    setSessionId(null);
    setReloadRecovery((k) => k + 1);
    toast("Sesión guardada.", "success");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Anatomy map */}
      <Card variant="glass" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle>Mapa muscular</CardTitle>
          {selected ? (
            <span className="text-accent text-sm font-semibold">
              {MUSCLE_LABEL[selected]}
            </span>
          ) : null}
        </div>
        <CardDescription>
          Toca un músculo para ver su recuperación y filtrar ejercicios.
        </CardDescription>
        <BodySkeletonSVG
          recovery={recovery}
          selected={selected}
          onSelect={(m) => setSelected(m)}
        />
      </Card>

      {/* Session controls */}
      {selected ? (
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-fg font-semibold">
              {sessionId ? "Sesión activa" : "Entrena"} · {MUSCLE_LABEL[selected]}
            </p>
            <p className="text-fg-muted text-xs">
              {recoveryHint(recovery, selected)}
            </p>
          </div>
          {sessionId ? (
            <Button variant="secondary" onClick={finishSession}>
              Finalizar
            </Button>
          ) : (
            <Button onClick={startSession}>Iniciar sesión</Button>
          )}
        </Card>
      ) : null}

      {/* Exercise list */}
      {selected ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-fg-muted text-xs font-semibold tracking-widest uppercase">
            Ejercicios de {MUSCLE_LABEL[selected]}
          </h2>
          {loadingEx ? (
            <ListSkeleton rows={4} />
          ) : shownExercises.length === 0 ? (
            <Card>
              <p className="text-fg-muted text-sm">
                No hay ejercicios para este grupo.
              </p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {shownExercises.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => setOpenEx(ex)}
                    className="glass hover:border-accent/60 flex w-full items-center justify-between gap-2 rounded-2xl p-4 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-fg font-semibold">{ex.name}</p>
                      <p className="text-fg-muted text-xs">
                        {ex.equipment} · {IMPACT_LABEL[ex.jointImpact]}
                      </p>
                    </div>
                    <span className="text-accent shrink-0 text-sm font-semibold">
                      Ver ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Measurements */}
      <MeasurementCard onSaved={() => toast("Medida registrada.", "success")} />

      {/* Exercise detail / set logger */}
      {openEx ? (
        <ExerciseDrawer
          exercise={openEx}
          sessionId={sessionId}
          onClose={() => setOpenEx(null)}
          onLogged={() => setReloadRecovery((k) => k + 1)}
        />
      ) : null}
    </div>
  );
}

function recoveryHint(recovery: MuscleRecovery[], m: MuscleGroup): string {
  const rec = recovery.find((r) => r.muscle === m);
  if (!rec || rec.state === "FRESH") return "Fresco · listo para entrenar";
  if (rec.state === "WORKED") return "Trabajado recientemente · intensidad moderada";
  return "Fatigado · considera priorizar otro grupo o bajar volumen";
}

function ExerciseDrawer({
  exercise,
  sessionId,
  onClose,
  onLogged,
}: {
  exercise: ApiExercise;
  sessionId: string | null;
  onClose: () => void;
  onLogged: () => void;
}) {
  const { toast } = useToast();
  const [weight, setWeight] = React.useState("");
  const [reps, setReps] = React.useState(String(exercise.defaultRepsLow));
  const [setNumber, setSetNumber] = React.useState(1);
  const [logged, setLogged] = React.useState<
    { set: number; weight: number; reps: number; isPr: boolean }[]
  >([]);
  const [saving, setSaving] = React.useState(false);

  async function logSet() {
    if (!sessionId) {
      toast("Inicia una sesión para registrar series.", "error");
      return;
    }
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || w < 0 || !Number.isInteger(r) || r < 1) {
      toast("Introduce peso y repeticiones válidos.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/gym/sessions/${sessionId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          setNumber,
          weightKg: w,
          reps: r,
        }),
      });
      if (!res.ok) {
        toast("No se pudo registrar la serie.", "error");
        return;
      }
      const data = (await res.json()) as { isPr: boolean };
      setLogged((prev) => [
        ...prev,
        { set: setNumber, weight: w, reps: r, isPr: data.isPr },
      ]);
      setSetNumber((n) => n + 1);
      onLogged();
      if (data.isPr) toast("🏆 ¡Récord personal!", "success");
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/70 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-bg border-border pb-safe max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-fg text-xl font-bold">{exercise.name}</h2>
            <p className="text-fg-muted text-xs">
              {exercise.equipment} · {IMPACT_LABEL[exercise.jointImpact]}
            </p>
          </div>
          <Button variant="ghost" className="px-3" aria-label="Cerrar" onClick={onClose}>
            ✕
          </Button>
        </div>

        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-fg text-sm font-semibold">Ejecución</h3>
            <p className="text-fg-muted text-sm">{exercise.execution}</p>
          </div>
          {exercise.commonMistakes.length > 0 ? (
            <div>
              <h3 className="text-fg text-sm font-semibold">Errores comunes</h3>
              <ul className="list-disc pl-5">
                {exercise.commonMistakes.map((m, i) => (
                  <li key={i} className="text-fg-muted text-sm">{m}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-fg-muted text-xs">
            Recomendado: {exercise.defaultSets} series ×{" "}
            {exercise.defaultRepsLow}–{exercise.defaultRepsHigh} reps · descanso{" "}
            {exercise.restSeconds}s
          </p>

          {/* Set logger */}
          <div className="border-border flex flex-col gap-3 rounded-xl border p-3">
            <p className="text-fg text-sm font-semibold">
              Registrar serie {setNumber}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Peso (kg)"
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <Input
                label="Reps"
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <Button onClick={logSet} disabled={saving}>
              {saving ? "Guardando…" : "Registrar serie"}
            </Button>
            <RestTimer seconds={exercise.restSeconds} />
          </div>

          {logged.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {logged.map((l, i) => (
                <li
                  key={i}
                  className="text-fg-muted flex items-center justify-between text-sm tabular-nums"
                >
                  <span>Serie {l.set}</span>
                  <span>
                    {l.weight} kg × {l.reps}{" "}
                    {l.isPr ? <span className="text-success font-semibold">PR</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function MeasurementCard({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [weight, setWeight] = React.useState("");
  const [waist, setWaist] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    const body: Record<string, number> = {};
    if (weight) body.weightKg = Number(weight);
    if (waist) body.waistCm = Number(waist);
    if (Object.keys(body).length === 0) {
      toast("Introduce al menos una medida.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/gym/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast("No se pudo guardar la medida.", "error");
        return;
      }
      setWeight("");
      setWaist("");
      onSaved();
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Medidas corporales</CardTitle>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Peso (kg)"
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <Input
          label="Cintura (cm)"
          type="number"
          inputMode="decimal"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
        />
      </div>
      <Button variant="secondary" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Registrar medida"}
      </Button>
    </Card>
  );
}
