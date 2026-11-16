"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Category = "TRAINING" | "GYM" | "NUTRITION" | "RECOVERY" | "PERSONAL";

interface Ev {
  id: string;
  title: string;
  category: Category;
  day: string;
  time: string | null;
  done: boolean;
  derived: boolean;
}

const CAT_COLOR: Record<Category, string> = {
  TRAINING: "var(--color-accent)",
  GYM: "var(--color-success)",
  NUTRITION: "var(--color-telemetry)",
  RECOVERY: "var(--color-fg-muted)",
  PERSONAL: "var(--color-fg)",
};
const CAT_LABEL: Record<Category, string> = {
  TRAINING: "Baloncesto",
  GYM: "Gym",
  NUTRITION: "Nutrición",
  RECOVERY: "Recuperación",
  PERSONAL: "Personal",
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function weekDays(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) out.push(dayKey(new Date(Date.now() + i * 86_400_000)));
  return out;
}
function label(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 86_400_000));
  if (day === today) return "Hoy";
  if (day === tomorrow) return "Mañana";
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", timeZone: "UTC" });
}

export function LifeOsWorkspace() {
  const { toast } = useToast();
  const days = React.useMemo(() => weekDays(), []);
  const [events, setEvents] = React.useState<Ev[]>([]);
  const [derived, setDerived] = React.useState<Ev[]>([]);
  const [reload, setReload] = React.useState(0);

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<Category>("PERSONAL");
  const [day, setDay] = React.useState(days[0]!);

  React.useEffect(() => {
    let cancelled = false;
    const from = days[0]!;
    const to = days[days.length - 1]!;
    void (async () => {
      try {
        const res = await fetch(`/api/planner?from=${from}&to=${to}`);
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { events: Ev[]; derived: Ev[] };
          setEvents(data.events);
          setDerived(data.derived);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload, days]);

  async function addEvent() {
    if (title.trim().length < 2) return;
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category, day }),
      });
      if (res.ok) {
        setTitle("");
        setReload((k) => k + 1);
        toast("Añadido al calendario.", "success");
      } else {
        toast("No se pudo añadir.", "error");
      }
    } catch {
      toast("Error de red.", "error");
    }
  }

  async function toggle(ev: Ev) {
    if (ev.derived) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === ev.id ? { ...e, done: !e.done } : e)),
    );
    await fetch(`/api/planner/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !ev.done }),
    }).catch(() => null);
  }

  async function remove(ev: Ev) {
    await fetch(`/api/planner/${ev.id}`, { method: "DELETE" }).catch(() => null);
    setReload((k) => k + 1);
  }

  const all = [...events, ...derived];

  return (
    <div className="flex flex-col gap-5">
      {/* Add event */}
      <Card className="flex flex-col gap-3">
        <CardTitle>Planificar</CardTitle>
        <Input
          placeholder="p. ej. Sesión de tiro, comida, descanso…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="bg-bg text-fg border-border min-h-touch flex-1 rounded-xl border px-2 text-sm"
            aria-label="Categoría"
          >
            {(Object.keys(CAT_LABEL) as Category[]).map((c) => (
              <option key={c} value={c}>{CAT_LABEL[c]}</option>
            ))}
          </select>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="bg-bg text-fg border-border min-h-touch flex-1 rounded-xl border px-2 text-sm"
            aria-label="Día"
          >
            {days.map((d) => (
              <option key={d} value={d}>{label(d)}</option>
            ))}
          </select>
        </div>
        <Button onClick={addEvent}>Añadir</Button>
      </Card>

      {/* Weekly agenda */}
      <div className="flex flex-col gap-4">
        {days.map((d) => {
          const items = all.filter((e) => e.day === d);
          return (
            <div key={d} className="flex flex-col gap-2">
              <h2 className="text-fg-muted text-xs font-semibold tracking-widest uppercase">
                {label(d)}
              </h2>
              {items.length === 0 ? (
                <p className="text-fg-muted/60 text-sm">Sin actividades</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((e) => (
                    <li
                      key={e.id}
                      className="glass flex items-center gap-3 rounded-xl p-3"
                    >
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ background: CAT_COLOR[e.category] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-fg truncate text-sm font-medium ${e.done ? "line-through opacity-60" : ""}`}>
                          {e.title}
                        </p>
                        <p className="text-fg-muted text-[11px]">
                          {CAT_LABEL[e.category]}
                          {e.derived ? " · registrado" : ""}
                        </p>
                      </div>
                      {e.derived ? (
                        <span className="text-success shrink-0 text-xs">✓</span>
                      ) : (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => toggle(e)}
                            className={`text-xs font-semibold ${e.done ? "text-success" : "text-accent"}`}
                          >
                            {e.done ? "Hecho" : "Marcar"}
                          </button>
                          <button onClick={() => remove(e)} className="text-danger text-xs">
                            ✕
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
