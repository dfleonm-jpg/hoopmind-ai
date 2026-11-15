"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  ShotChartSkeleton,
  StatsSkeleton,
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ShotChart, type ZoneStat } from "./ShotChart";
import { StreakCard } from "./StreakCard";
import { ScoutingCard, type Gamification } from "./ScoutingCard";
import { QuickStartDrawer } from "./QuickStartDrawer";

interface Stats {
  zones: ZoneStat[];
  streak: { current: number; best: number };
  suggestedDifficulty: number;
  totals: { made: number; attempted: number; pct: number };
  gamification?: Gamification;
}

interface WorkoutItem {
  id: string;
  title: string;
  durationMin: number;
  scenario: string;
  createdAt: string;
}

type Scenario = "FULL_COURT" | "HALF_COURT" | "STREET" | "GYM_NO_HOOP";

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "FULL_COURT", label: "Cancha completa" },
  { value: "HALF_COURT", label: "Media cancha" },
  { value: "STREET", label: "Calle / parque" },
  { value: "GYM_NO_HOOP", label: "Gimnasio sin aro" },
];

export function DashboardView({ workouts }: { workouts: WorkoutItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [format, setFormat] = React.useState<"" | "FIVE_V_FIVE" | "THREE_X_THREE">("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const [duration, setDuration] = React.useState<30 | 45 | 60>(45);
  const [scenario, setScenario] = React.useState<Scenario>("HALF_COURT");
  const [includePhysical, setIncludePhysical] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (format) params.set("format", format);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    // Async fetch; setState runs in a later microtask, not synchronously.
    void (async () => {
      try {
        const res = await fetch(`/api/stats?${params.toString()}`);
        if (res.ok && !cancelled) setStats((await res.json()) as Stats);
      } catch {
        // ignore — keep previous stats
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [format, from, to]);

  const hasData = stats != null && stats.totals.attempted > 0;

  async function generate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMin: duration,
          scenario,
          includePhysical,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const msg = data?.error?.message ?? "No se pudo generar la rutina.";
        setGenError(msg);
        toast(msg, "error");
        return;
      }
      const workout = (await res.json()) as { id: string };
      toast("Rutina generada. ¡A entrenar!", "success");
      router.push(`/train/${workout.id}`);
    } catch {
      setGenError("Error de red. Inténtalo de nuevo.");
      toast("Error de red. Inténtalo de nuevo.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quick-Start: hero "ENTRENAR YA" (v3) */}
      <QuickStartDrawer />

      {/* Generate workout (detailed controls) */}
      <Card variant="glass" className="flex flex-col gap-3">
        <CardTitle>Generar rutina con IA</CardTitle>
        <CardDescription>
          {stats
            ? `Dificultad sugerida según tu rendimiento: ${stats.suggestedDifficulty}/5`
            : "Elige tiempo y escenario y la IA crea tu sesión."}
        </CardDescription>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2" role="group" aria-label="Duración">
            {[30, 45, 60].map((d) => (
              <Button
                key={d}
                variant={duration === d ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setDuration(d as 30 | 45 | 60)}
              >
                {d} min
              </Button>
            ))}
          </div>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
            aria-label="Escenario"
            className="bg-bg text-fg border-border min-h-touch w-full rounded-xl border px-3 text-base"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Explosive-physical block toggle (v2 Block 4) */}
          <button
            type="button"
            role="switch"
            aria-checked={includePhysical}
            onClick={() => setIncludePhysical((v) => !v)}
            className="border-border flex min-h-touch items-center justify-between gap-3 rounded-xl border px-3"
          >
            <span className="text-fg text-left text-sm">
              Añadir potencia vertical / agilidad / core
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                includePhysical ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  includePhysical ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {genError ? (
          <p
            role="alert"
            className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm"
          >
            {genError}
          </p>
        ) : null}

        <Button onClick={generate} disabled={generating}>
          {generating ? "Generando…" : "Generar y entrenar"}
        </Button>
      </Card>

      {/* Scouting card (XP / level / archetype / badges) */}
      {!loadingStats && stats?.gamification ? (
        <ScoutingCard data={stats.gamification} />
      ) : null}

      {/* Streaks */}
      {loadingStats ? (
        <StatsSkeleton />
      ) : stats ? (
        <StreakCard current={stats.streak.current} best={stats.streak.best} />
      ) : null}

      {/* Shot chart + filters */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle>Shot chart</CardTitle>
          {stats ? (
            <span className="text-fg-muted text-xs tabular-nums">
              {stats.totals.made}/{stats.totals.attempted} ·{" "}
              {Math.round(stats.totals.pct * 100)}%
            </span>
          ) : null}
        </div>

        {/* Filters (Req. 7.2) */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-fg-muted text-xs">Desde</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-bg text-fg border-border min-h-touch rounded-xl border px-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-fg-muted text-xs">Hasta</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-bg text-fg border-border min-h-touch rounded-xl border px-2 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2" role="group" aria-label="Formato">
          {[
            { v: "", l: "Todos" },
            { v: "FIVE_V_FIVE", l: "5v5" },
            { v: "THREE_X_THREE", l: "3x3" },
          ].map((f) => (
            <Button
              key={f.v || "all"}
              variant={format === f.v ? "primary" : "secondary"}
              className="flex-1"
              onClick={() => setFormat(f.v as typeof format)}
            >
              {f.l}
            </Button>
          ))}
        </div>

        {loadingStats ? (
          <ShotChartSkeleton />
        ) : hasData ? (
          <ShotChart zones={stats!.zones} />
        ) : (
          <div className="border-border rounded-xl border border-dashed p-6 text-center">
            <p className="text-fg-muted text-sm">
              Aún no hay tiros registrados. Genera una rutina y registra tus
              tiros en el modo entrenamiento.
            </p>
          </div>
        )}
      </Card>

      {/* Saved workouts */}
      <Card className="flex flex-col gap-3">
        <CardTitle>Tus rutinas</CardTitle>
        {workouts.length === 0 ? (
          <CardDescription>Aún no has generado rutinas.</CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link href={`/train/${w.id}`} className="block">
                  <div className="border-border hover:border-accent flex items-center justify-between rounded-xl border px-3 py-3 transition-colors">
                    <div className="min-w-0">
                      <p className="text-fg truncate font-medium">{w.title}</p>
                      <p className="text-fg-muted text-xs">
                        {w.durationMin} min · {w.scenario}
                      </p>
                    </div>
                    <span className="text-accent text-sm font-semibold">
                      Entrenar ›
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/analyze">
          <Button variant="secondary" className="w-full">
            Analizar tiro
          </Button>
        </Link>
        <Link href="/onboarding">
          <Button variant="secondary" className="w-full">
            Editar perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}
