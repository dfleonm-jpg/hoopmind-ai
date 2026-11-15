"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Duration = 15 | 30 | 45 | 60;
type Scenario = "FULL_COURT" | "HALF_COURT" | "GYM_NO_HOOP" | "PHYSICAL_ONLY";
type Readiness = "FRESH" | "FATIGUED" | "RECOVERY";

const DURATIONS: { v: Duration; l: string }[] = [
  { v: 15, l: "15m" },
  { v: 30, l: "30m" },
  { v: 45, l: "45m" },
  { v: 60, l: "60m" },
];

const SCENARIOS: { v: Scenario; l: string }[] = [
  { v: "FULL_COURT", l: "Cancha completa" },
  { v: "HALF_COURT", l: "Media cancha" },
  { v: "GYM_NO_HOOP", l: "Solo balón" },
  { v: "PHYSICAL_ONLY", l: "Físico / Explosividad" },
];

const READINESS: { v: Readiness; l: string }[] = [
  { v: "FRESH", l: "Al 100%" },
  { v: "FATIGUED", l: "Piernas pesadas" },
  { v: "RECOVERY", l: "Recuperación" },
];

function Option({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-touch rounded-xl border px-3 text-sm font-semibold transition-colors ${
        selected
          ? "bg-accent text-on-accent border-accent"
          : "bg-card text-fg border-border hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}

export function QuickStartDrawer() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [duration, setDuration] = React.useState<Duration>(30);
  const [scenario, setScenario] = React.useState<Scenario>("HALF_COURT");
  const [readiness, setReadiness] = React.useState<Readiness>("FRESH");
  const [loading, setLoading] = React.useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMin: duration,
          scenario,
          readiness,
          includePhysical: scenario === "PHYSICAL_ONLY",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        toast(data?.error?.message ?? "No se pudo generar la rutina.", "error");
        return;
      }
      const workout = (await res.json()) as { id: string };
      toast("¡Rutina lista! A entrenar.", "success");
      router.push(`/train/${workout.id}`);
    } catch {
      toast("Error de red. Inténtalo de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full text-lg tracking-wide"
        onClick={() => setOpen(true)}
      >
        ⚡ ENTRENAR YA
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[55] flex items-end justify-center bg-black/70 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Inicio rápido de entrenamiento"
          >
            <motion.div
              className="glass pb-safe w-full max-w-md rounded-t-2xl p-5 sm:rounded-2xl"
              initial={{ y: 40, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-fg text-lg font-bold">Entrenar ya</h2>
                <Button
                  variant="ghost"
                  className="px-3"
                  aria-label="Cerrar"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <fieldset>
                  <legend className="text-fg-muted mb-2 text-xs font-semibold tracking-widest uppercase">
                    Tiempo
                  </legend>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map((d) => (
                      <Option
                        key={d.v}
                        label={d.l}
                        selected={duration === d.v}
                        onClick={() => setDuration(d.v)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-fg-muted mb-2 text-xs font-semibold tracking-widest uppercase">
                    Escenario
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SCENARIOS.map((s) => (
                      <Option
                        key={s.v}
                        label={s.l}
                        selected={scenario === s.v}
                        onClick={() => setScenario(s.v)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-fg-muted mb-2 text-xs font-semibold tracking-widest uppercase">
                    ¿Cómo estás hoy?
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {READINESS.map((r) => (
                      <Option
                        key={r.v}
                        label={r.l}
                        selected={readiness === r.v}
                        onClick={() => setReadiness(r.v)}
                      />
                    ))}
                  </div>
                </fieldset>

                <Button
                  size="lg"
                  className="mt-1 w-full"
                  disabled={loading}
                  onClick={start}
                >
                  {loading ? "Generando…" : "Generar y entrenar"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
