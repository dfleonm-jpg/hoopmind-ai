"use client";

import * as React from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { StatsSkeleton } from "@/components/ui/skeleton";

interface Weekly {
  gym: { sessions: number; prs: number; totalVolume: number };
  nutrition: { daysLogged: number };
  recovery: { avgSleep: number | null; checkIns: number };
  basketball: { sessionsCompleted: number; made: number; attempted: number; pct: number };
  habits: { completions: number };
  highlights: string[];
  focus: string[];
}

export function WeeklyReport() {
  const [data, setData] = React.useState<Weekly | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/analytics/weekly");
        if (res.ok && !cancelled) setData((await res.json()) as Weekly);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <StatsSkeleton />;
  if (!data) return null;

  const stats: { label: string; value: string }[] = [
    { label: "Sesiones gym", value: String(data.gym.sessions) },
    { label: "PRs", value: String(data.gym.prs) },
    { label: "Días con dieta", value: String(data.nutrition.daysLogged) },
    {
      label: "Sueño medio",
      value: data.recovery.avgSleep != null ? `${data.recovery.avgSleep} h` : "—",
    },
    {
      label: "Tiro",
      value:
        data.basketball.attempted > 0
          ? `${Math.round(data.basketball.pct * 100)}%`
          : "—",
    },
    { label: "Hábitos", value: String(data.habits.completions) },
  ];

  return (
    <Card variant="glass" className="flex flex-col gap-4">
      <CardTitle>Informe semanal</CardTitle>
      <ul className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <li
            key={s.label}
            className="border-border flex flex-col items-center rounded-xl border py-2 text-center"
          >
            <span className="text-fg text-lg font-extrabold tabular-nums">{s.value}</span>
            <span className="text-fg-muted text-[10px]">{s.label}</span>
          </li>
        ))}
      </ul>

      {data.highlights.length > 0 ? (
        <div>
          <p className="text-success mb-1 text-xs font-semibold tracking-widest uppercase">
            Logros
          </p>
          <ul className="list-disc pl-5">
            {data.highlights.map((h, i) => (
              <li key={i} className="text-fg-muted text-sm">{h}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.focus.length > 0 ? (
        <div>
          <p className="text-accent mb-1 text-xs font-semibold tracking-widest uppercase">
            A mejorar
          </p>
          <ul className="list-disc pl-5">
            {data.focus.map((f, i) => (
              <li key={i} className="text-fg-muted text-sm">{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
