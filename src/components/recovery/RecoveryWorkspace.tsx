"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Readiness {
  score: number;
  band: "LOW" | "MODERATE" | "HIGH";
  recommendation: string;
  overreachingFlag: boolean;
}
interface HabitRow {
  id: string;
  name: string;
  icon: string | null;
  doneToday: boolean;
  streak: number;
}

const SCALE: { v: number; l: string }[] = [
  { v: 1, l: "1" },
  { v: 2, l: "2" },
  { v: 3, l: "3" },
  { v: 4, l: "4" },
  { v: 5, l: "5" },
];

const BAND_COLOR: Record<Readiness["band"], string> = {
  LOW: "var(--color-danger)",
  MODERATE: "var(--color-accent)",
  HIGH: "var(--color-success)",
};

function ScaleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-fg text-sm font-medium">{label}</span>
        <span className="text-fg-muted text-[11px]">{hint}</span>
      </div>
      <div className="flex gap-1.5">
        {SCALE.map((s) => (
          <button
            key={s.v}
            onClick={() => onChange(s.v)}
            aria-pressed={value === s.v}
            className={`min-h-touch flex-1 rounded-lg border text-sm font-semibold ${
              value === s.v
                ? "bg-accent text-on-accent border-accent"
                : "bg-card text-fg-muted border-border"
            }`}
          >
            {s.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecoveryWorkspace() {
  const { toast } = useToast();
  const [readiness, setReadiness] = React.useState<Readiness | null>(null);
  const [habits, setHabits] = React.useState<HabitRow[]>([]);
  const [reload, setReload] = React.useState(0);

  const [sleepHours, setSleepHours] = React.useState("");
  const [sleepQuality, setSleepQuality] = React.useState<number | null>(null);
  const [fatigue, setFatigue] = React.useState<number | null>(null);
  const [soreness, setSoreness] = React.useState<number | null>(null);
  const [stress, setStress] = React.useState<number | null>(null);
  const [energy, setEnergy] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [newHabit, setNewHabit] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [r, h] = await Promise.all([
          fetch("/api/recovery").then((x) => x.json()),
          fetch("/api/habits").then((x) => x.json()),
        ]);
        if (cancelled) return;
        setReadiness(r.readiness ?? null);
        setHabits(h.habits ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function saveCheckIn() {
    setSaving(true);
    try {
      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleepHours: sleepHours ? Number(sleepHours) : undefined,
          sleepQuality: sleepQuality ?? undefined,
          fatigue: fatigue ?? undefined,
          soreness: soreness ?? undefined,
          stress: stress ?? undefined,
          energy: energy ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        readiness?: Readiness;
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast(data?.error?.message ?? "No se pudo guardar.", "error");
        return;
      }
      setReadiness(data?.readiness ?? null);
      toast("Check-in guardado.", "success");
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addHabit() {
    if (newHabit.trim().length < 2) return;
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHabit.trim() }),
      });
      if (res.ok) {
        setNewHabit("");
        setReload((k) => k + 1);
      } else {
        toast("No se pudo crear el hábito.", "error");
      }
    } catch {
      toast("Error de red.", "error");
    }
  }

  async function toggleHabit(id: string) {
    const day = new Date().toISOString().slice(0, 10);
    // optimistic
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              doneToday: !h.doneToday,
              streak: h.doneToday ? Math.max(0, h.streak - 1) : h.streak + 1,
            }
          : h,
      ),
    );
    try {
      await fetch(`/api/habits/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      setReload((k) => k + 1);
    } catch {
      setReload((k) => k + 1);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Readiness */}
      {readiness ? (
        <Card variant="glass" className="flex flex-col items-center gap-2 text-center">
          <span className="text-fg-muted text-xs font-semibold tracking-widest uppercase">
            Preparación para entrenar
          </span>
          <div
            className="text-5xl font-extrabold tabular-nums"
            style={{ color: BAND_COLOR[readiness.band] }}
          >
            {readiness.score}
          </div>
          <p className="text-fg-muted text-sm">{readiness.recommendation}</p>
          {readiness.overreachingFlag ? (
            <p className="border-danger/40 bg-danger/10 text-danger mt-1 rounded-lg border px-3 py-2 text-xs">
              Señales de fatiga acumulada. Esto no es un diagnóstico médico; si
              persiste, consulta a un profesional de la salud.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Check-in */}
      <Card className="flex flex-col gap-4">
        <CardTitle>Check-in de hoy</CardTitle>
        <CardDescription>
          Registra cómo te sientes. Ajustamos tu preparación para entrenar.
        </CardDescription>
        <Input
          label="Horas de sueño"
          type="number"
          inputMode="decimal"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
        />
        <ScaleRow label="Calidad del sueño" hint="1 mala · 5 excelente" value={sleepQuality} onChange={setSleepQuality} />
        <ScaleRow label="Fatiga" hint="1 nada · 5 mucha" value={fatigue} onChange={setFatigue} />
        <ScaleRow label="Dolor muscular" hint="1 nada · 5 mucho" value={soreness} onChange={setSoreness} />
        <ScaleRow label="Estrés" hint="1 bajo · 5 alto" value={stress} onChange={setStress} />
        <ScaleRow label="Energía" hint="1 baja · 5 alta" value={energy} onChange={setEnergy} />
        <Button onClick={saveCheckIn} disabled={saving}>
          {saving ? "Guardando…" : "Guardar check-in"}
        </Button>
      </Card>

      {/* Habits */}
      <Card className="flex flex-col gap-3">
        <CardTitle>Hábitos</CardTitle>
        {habits.length === 0 ? (
          <CardDescription>
            Crea hábitos y mantén tu racha diaria.
          </CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {habits.map((h) => (
              <li
                key={h.id}
                className="border-border flex items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="text-fg truncate font-medium">{h.name}</p>
                  <p className="text-fg-muted text-xs">🔥 {h.streak} días</p>
                </div>
                <Button
                  variant={h.doneToday ? "primary" : "secondary"}
                  className="min-h-0 h-10 shrink-0 px-4 text-sm"
                  onClick={() => toggleHabit(h.id)}
                >
                  {h.doneToday ? "Hecho ✓" : "Marcar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Nuevo hábito…"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addHabit();
            }}
          />
          <Button onClick={addHabit}>Añadir</Button>
        </div>
      </Card>
    </div>
  );
}
