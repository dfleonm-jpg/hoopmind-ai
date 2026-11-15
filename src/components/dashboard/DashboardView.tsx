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
import { TelemetryRings, type RingData } from "./TelemetryRings";

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

  // Gym load (avg fatigue) for the "Carga" telemetry ring.
  const [avgLoad, setAvgLoad] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/gym/recovery");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as {
            muscles: { fatigue: number }[];
          };
          const avg =
            data.muscles.length > 0
              ? data.muscles.reduce((s, m) => s + m.fatigue, 0) /
                data.muscles.length
              : 0;
          setAvgLoad(avg);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = stats != null && stats.totals.attempted > 0;

  const rings: RingData[] = [
    {
      label: "Carga",
      value: avgLoad,
      display: `${Math.round(avgLoad * 100)}`,
      color: "var(--color-accent)",
    },
    {
      label: "Tiro",
      value: stats?.totals.pct ?? 0,
      display: `${Math.round((stats?.totals.pct ?? 0) * 100)}`,
      color: "var(--color-success)",
    },
    {
      label: "Consistencia",
      value: Math.min(1, (stats?.streak.current ?? 0) / 7),
      display: `${stats?.streak.current ?? 0}`,
      color: "var(--color-telemetry)",
    },
  ];

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

      {/* Telemetry rings: Carga · Tiro · Consistencia (v4) */}
      <Card variant="glass">
        <TelemetryRings rings={rings} />
      </Card>

      {/* AI Coach entry (core) */}
      <Link href="/coach">
        <Card variant="glass" className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🧠</span>
            <div>
              <CardTitle className="text-base">AI Coach</CardTitle>
              <CardDescription>
                Pregunta a tu cerebro de rendimiento con tus datos reales.
              </CardDescription>
            </div>
          </div>
          <span className="text-accent shrink-0 text-sm font-semibold">Abrir ›</span>
        </Card>
      </Link>

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

      {/* Quick links — glowing module tiles */}
      <div>
        <p className="text-fg-muted mb-2.5 text-xs font-semibold tracking-widest uppercase">
          Explora el ecosistema
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MODULE_TILES.map((t) => (
            <ModuleTile key={t.href} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}

const MODULE_TILES = [
  { href: "/gym", label: "Body", sub: "Fuerza", icon: "M6 7v10M18 7v10M6 12h12", tint: "var(--color-success)" },
  { href: "/plyometrics", label: "Pliometría", sub: "Salto", icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z", tint: "var(--color-violet)" },
  { href: "/nutrition", label: "Nutrición", sub: "Macros", icon: "M6 2v7a3 3 0 0 0 6 0V2M9 9v13M16 2c-1.5 2-2 4-2 6s.5 4 2 4 2-2 2-4-.5-4-2-6z", tint: "var(--color-telemetry)" },
  { href: "/recovery", label: "Recovery", sub: "Readiness", icon: "M22 12h-4l-3 9L9 3l-3 9H2", tint: "var(--color-success)" },
  { href: "/glowup", label: "Glow Up", sub: "Cuidado", icon: "M12 3v2M12 19v2M5 12H3M21 12h-2M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", tint: "var(--color-accent)" },
  { href: "/life", label: "Life OS", sub: "Agenda", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", tint: "var(--color-telemetry)" },
  { href: "/combine", label: "Combine", sub: "Pruebas", icon: "M6 9V2h12v7a6 6 0 0 1-12 0zM6 22h12M9 18v4M15 18v4", tint: "var(--color-accent)" },
  { href: "/analyze", label: "Form Check", sub: "Cámara", icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z", tint: "var(--color-telemetry)" },
  { href: "/plays", label: "Pizarra", sub: "Jugadas", icon: "M4 4h16v16H4zM4 9h16M9 9v11", tint: "var(--color-accent)" },
  { href: "/onboarding", label: "Perfil", sub: "Editar", icon: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", tint: "var(--color-fg-muted)" },
] as const;

function ModuleTile({
  href,
  label,
  sub,
  icon,
  tint,
}: {
  href: string;
  label: string;
  sub: string;
  icon: string;
  tint: string;
}) {
  return (
    <Link href={href}>
      <div className="glass group flex items-center gap-3 rounded-2xl p-3 transition-transform active:scale-[0.97]">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-shadow"
          style={{
            color: tint,
            background: `color-mix(in srgb, ${tint} 14%, transparent)`,
            boxShadow: `0 0 22px -8px ${tint}`,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={icon} />
          </svg>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-fg truncate text-sm font-semibold">{label}</span>
          <span className="text-fg-muted text-[11px]">{sub}</span>
        </span>
      </div>
    </Link>
  );
}
