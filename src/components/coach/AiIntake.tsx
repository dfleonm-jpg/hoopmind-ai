"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

/**
 * Conversational AI intake: the coach asks everything up front, then generates
 * a first routine. Answers also update the profile where they map cleanly.
 */

type Choice = { value: string; label: string };
interface Question {
  id: string;
  ask: string;
  help?: string;
  multi?: boolean;
  min?: number;
  max?: number;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    id: "mainGoal",
    ask: "¿Cuál es tu objetivo principal ahora mismo?",
    choices: [
      { value: "SHOOTING", label: "Mejorar mi tiro" },
      { value: "BALL_HANDLING", label: "Mejor manejo de balón" },
      { value: "VERTICAL", label: "Saltar más / explosividad" },
      { value: "MUSCLE_GAIN", label: "Ganar masa muscular" },
      { value: "WEIGHT_LOSS", label: "Perder grasa" },
      { value: "DEFENSE", label: "Defender mejor" },
    ],
  },
  {
    id: "secondaryGoals",
    ask: "¿Qué más quieres trabajar? (elige los que quieras)",
    multi: true,
    max: 4,
    choices: [
      { value: "SPEED", label: "Velocidad" },
      { value: "ENDURANCE", label: "Resistencia" },
      { value: "STRENGTH", label: "Fuerza" },
      { value: "MOBILITY", label: "Movilidad" },
      { value: "IQ", label: "IQ de juego" },
      { value: "FINISHING", label: "Finalización" },
    ],
  },
  {
    id: "scenario",
    ask: "¿Dónde vas a entrenar hoy?",
    choices: [
      { value: "FULL_COURT", label: "Cancha completa" },
      { value: "HALF_COURT", label: "Media cancha" },
      { value: "GYM_NO_HOOP", label: "Solo con balón (sin aro)" },
      { value: "PHYSICAL_ONLY", label: "Solo físico / gimnasio" },
    ],
  },
  {
    id: "duration",
    ask: "¿Cuánto tiempo tienes?",
    choices: [
      { value: "15", label: "15 min" },
      { value: "30", label: "30 min" },
      { value: "45", label: "45 min" },
      { value: "60", label: "60 min" },
    ],
  },
  {
    id: "readiness",
    ask: "¿Cómo te sientes físicamente hoy?",
    choices: [
      { value: "FRESH", label: "Al 100%" },
      { value: "FATIGUED", label: "Piernas pesadas" },
      { value: "RECOVERY", label: "En recuperación" },
    ],
  },
  {
    id: "injuries",
    ask: "¿Tienes alguna molestia o lesión a cuidar?",
    help: "Adaptaremos los ejercicios. Esto no sustituye una valoración médica.",
    multi: true,
    choices: [
      { value: "none", label: "Ninguna" },
      { value: "knee", label: "Rodilla" },
      { value: "ankle", label: "Tobillo" },
      { value: "back", label: "Espalda baja" },
      { value: "shoulder", label: "Hombro" },
    ],
  },
];

export function AiIntake({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [generating, setGenerating] = React.useState(false);

  const q = QUESTIONS[step]!;
  const current = answers[q.id] ?? [];
  const isLast = step === QUESTIONS.length - 1;

  function toggle(value: string) {
    setAnswers((prev) => {
      const sel = prev[q.id] ?? [];
      if (q.multi) {
        // "none" is exclusive.
        if (value === "none") return { ...prev, [q.id]: sel.includes("none") ? [] : ["none"] };
        const withoutNone = sel.filter((v) => v !== "none");
        const has = withoutNone.includes(value);
        if (has) return { ...prev, [q.id]: withoutNone.filter((v) => v !== value) };
        if (q.max && withoutNone.length >= q.max) return prev;
        return { ...prev, [q.id]: [...withoutNone, value] };
      }
      return { ...prev, [q.id]: [value] };
    });
  }

  function next() {
    if (!q.multi && current.length === 0) {
      toast("Elige una opción.", "info");
      return;
    }
    if (isLast) void finish();
    else setStep((s) => s + 1);
  }

  async function finish() {
    setGenerating(true);
    try {
      const res = await fetch("/api/coach/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainGoal: answers.mainGoal?.[0],
          secondaryGoals: answers.secondaryGoals ?? [],
          scenario: answers.scenario?.[0] ?? "HALF_COURT",
          durationMin: Number(answers.duration?.[0] ?? 45),
          readiness: answers.readiness?.[0] ?? "FRESH",
          injuries: (answers.injuries ?? []).filter((i) => i !== "none"),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        workoutId?: string;
        error?: { message?: string };
      } | null;
      if (!res.ok || !data?.workoutId) {
        toast(data?.error?.message ?? "No se pudo generar tu rutina.", "error");
        return;
      }
      toast("¡Tu primera rutina está lista!", "success");
      router.push(`/train/${data.workoutId}`);
    } catch {
      toast("Error de red. Inténtalo de nuevo.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card variant="glass" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-accent text-[11px] font-semibold tracking-widest uppercase">
          Coach IA · Encuesta
        </span>
        <span className="text-fg-muted text-xs tabular-nums">
          {step + 1}/{QUESTIONS.length}
        </span>
      </div>

      {/* progress */}
      <div className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full">
        <motion.div
          className="from-accent-hover to-accent h-full rounded-full bg-gradient-to-r"
          animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <CardTitle className="text-lg">{q.ask}</CardTitle>
          {q.help ? <CardDescription>{q.help}</CardDescription> : null}

          <div className="grid grid-cols-2 gap-2">
            {q.choices.map((c) => {
              const sel = current.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggle(c.value)}
                  aria-pressed={sel}
                  className={`min-h-touch rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    sel
                      ? "bg-accent text-on-accent border-accent glow-accent"
                      : "bg-card/60 text-fg border-white/10 hover:border-accent/50"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        {step > 0 ? (
          <Button variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Atrás
          </Button>
        ) : onClose ? (
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        ) : null}
        <Button className="flex-1" onClick={next} disabled={generating}>
          {generating ? "Generando…" : isLast ? "Generar rutina" : "Siguiente"}
        </Button>
      </div>
    </Card>
  );
}
