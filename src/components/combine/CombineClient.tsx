"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { playCue, unlockAudio } from "@/lib/audio/feedback";

type TestType = "FIFTY_THREES" | "HANDLE_FINISH" | "CLUTCH_FT";

interface TestDef {
  type: TestType;
  name: string;
  description: string;
  maxScore: number;
  /** optional fixed time limit in seconds (0 = untimed, stopwatch). */
  limitS: number;
}

const TESTS: TestDef[] = [
  {
    type: "FIFTY_THREES",
    name: "Test 50 Triples",
    description: "5 posiciones × 10 tiros. Cuenta cada triple encestado.",
    maxScore: 50,
    limitS: 0,
  },
  {
    type: "HANDLE_FINISH",
    name: "Circuito Manejo + Finalización",
    description: "Series bajo reloj. Cuenta finalizaciones completadas.",
    maxScore: 20,
    limitS: 120,
  },
  {
    type: "CLUTCH_FT",
    name: "Tiros Libres bajo Presión",
    description: "20 tiros libres. Puntúa por rachas consecutivas.",
    maxScore: 20,
    limitS: 0,
  },
];

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function CombineClient() {
  const { toast } = useToast();
  const [active, setActive] = React.useState<TestDef | null>(null);

  if (active) {
    return (
      <TestRunner
        def={active}
        onExit={() => setActive(null)}
        onSaved={(msg) => {
          toast(msg, "success");
          setActive(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {TESTS.map((t) => (
        <Card key={t.type} variant="glass" className="flex flex-col gap-2">
          <CardTitle>{t.name}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
          <Button className="mt-1 w-full" onClick={() => setActive(t)}>
            Empezar prueba
          </Button>
        </Card>
      ))}
    </div>
  );
}

function TestRunner({
  def,
  onExit,
  onSaved,
}: {
  def: TestDef;
  onExit: () => void;
  onSaved: (msg: string) => void;
}) {
  const { toast } = useToast();
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0); // for CLUTCH_FT scoring
  const [attempts, setAttempts] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const startRef = React.useRef<number>(0);

  const timed = def.limitS > 0;

  React.useEffect(() => {
    if (!running) return;
    startRef.current = startRef.current || Date.now();
    const tick = () => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      if (timed) {
        const left = Math.max(0, def.limitS - s);
        setElapsed(left);
        if (left <= 0) {
          setRunning(false);
          setFinished(true);
          playCue("buzzer");
        }
      } else {
        setElapsed(s);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, timed, def.limitS]);

  function start() {
    unlockAudio();
    startRef.current = Date.now();
    setRunning(true);
    setFinished(false);
    setElapsed(timed ? def.limitS : 0);
  }

  function made() {
    playCue("made");
    setAttempts((a) => a + 1);
    if (def.type === "CLUTCH_FT") {
      // Streak scoring: each consecutive make is worth more (capped).
      setStreak((st) => {
        const ns = st + 1;
        setScore((sc) => Math.min(def.maxScore, sc + Math.min(ns, 3)));
        return ns;
      });
    } else {
      setScore((sc) => Math.min(def.maxScore, sc + 1));
    }
    autoFinishIfDone();
  }

  function miss() {
    playCue("attempt");
    setAttempts((a) => a + 1);
    if (def.type === "CLUTCH_FT") setStreak(0);
    autoFinishIfDone();
  }

  function autoFinishIfDone() {
    // Untimed tests end after a fixed number of attempts.
    const cap = def.type === "FIFTY_THREES" ? 50 : def.type === "CLUTCH_FT" ? 20 : Infinity;
    if (attempts + 1 >= cap && !timed) {
      setRunning(false);
      setFinished(true);
    }
  }

  async function save() {
    setSaving(true);
    const durationS = timed
      ? def.limitS
      : Math.floor((Date.now() - startRef.current) / 1000);
    try {
      const res = await fetch("/api/combine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: def.type,
          score,
          maxScore: def.maxScore,
          durationS,
        }),
      });
      if (!res.ok) {
        toast("No se pudo guardar el resultado.", "error");
        return;
      }
      const data = (await res.json()) as { ovrDelta: number };
      onSaved(`Resultado guardado · +${data.ovrDelta} OVR`);
    } catch {
      toast("Error de red al guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" className="self-start px-3" onClick={onExit}>
        ‹ Pruebas
      </Button>

      <Card className="flex flex-col gap-3">
        <CardTitle>{def.name}</CardTitle>
        <CardDescription>{def.description}</CardDescription>

        <div className="flex items-center justify-around py-2">
          <div className="flex flex-col items-center">
            <span className="text-success text-5xl font-black tabular-nums" style={{ textShadow: "0 0 18px color-mix(in srgb, var(--color-success) 60%, transparent)" }}>
              {score}
            </span>
            <span className="text-fg-muted text-xs">de {def.maxScore}</span>
          </div>
          <div className="flex flex-col items-center">
            <span
              className={`text-5xl font-black tabular-nums ${
                timed && elapsed <= 10 && running ? "text-danger" : "text-telemetry text-glow-telemetry"
              }`}
            >
              {fmt(elapsed)}
            </span>
            <span className="text-fg-muted text-xs">
              {timed ? "restante" : "transcurrido"}
            </span>
          </div>
          {def.type === "CLUTCH_FT" ? (
            <div className="flex flex-col items-center">
              <span className="text-accent text-4xl font-extrabold tabular-nums">
                {streak}
              </span>
              <span className="text-fg-muted text-xs">racha</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-fg text-4xl font-extrabold tabular-nums">
                {attempts}
              </span>
              <span className="text-fg-muted text-xs">intentos</span>
            </div>
          )}
        </div>

        {!running && !finished ? (
          <Button size="lg" onClick={start}>
            Iniciar
          </Button>
        ) : null}

        {running ? (
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className="h-20 text-lg" onClick={made}>
              ✓ Encestado
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-20 text-lg"
              onClick={miss}
            >
              ✕ Fallado
            </Button>
          </div>
        ) : null}

        {running ? (
          <Button
            variant="ghost"
            onClick={() => {
              setRunning(false);
              setFinished(true);
            }}
          >
            Terminar prueba
          </Button>
        ) : null}

        {finished ? (
          <div className="flex flex-col gap-2">
            <p className="text-fg text-center text-sm">
              Puntuación final: <span className="font-bold">{score}</span> /{" "}
              {def.maxScore}
            </p>
            <Button size="lg" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar resultado"}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
