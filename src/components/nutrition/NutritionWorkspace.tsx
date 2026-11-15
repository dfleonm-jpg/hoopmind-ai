"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Goal {
  objective: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
}
interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}
interface FoodLogRow {
  id: string;
  mealType: string;
  name: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
interface FoodItem {
  sourceRef: string;
  name: string;
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
}

const OBJECTIVES = [
  { v: "MUSCLE_GAIN", l: "Ganar músculo" },
  { v: "MAINTENANCE", l: "Mantenimiento" },
  { v: "PERFORMANCE", l: "Rendimiento" },
  { v: "RECOMPOSITION", l: "Recomposición" },
];
const ACTIVITIES = [
  { v: "SEDENTARY", l: "Sedentario" },
  { v: "LIGHT", l: "Ligero" },
  { v: "MODERATE", l: "Moderado" },
  { v: "ACTIVE", l: "Activo" },
  { v: "VERY_ACTIVE", l: "Muy activo" },
];
const MEALS = [
  { v: "BREAKFAST", l: "Desayuno" },
  { v: "LUNCH", l: "Comida" },
  { v: "DINNER", l: "Cena" },
  { v: "SNACK", l: "Snack" },
];

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className="text-fg tabular-nums">
          {Math.round(value)}/{target} {unit}
        </span>
      </div>
      <div className="bg-border h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function NutritionWorkspace() {
  const { toast } = useToast();
  const [goal, setGoal] = React.useState<Goal | null>(null);
  const [totals, setTotals] = React.useState<Totals>({
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  });
  const [logs, setLogs] = React.useState<FoodLogRow[]>([]);
  const [hydrationMl, setHydrationMl] = React.useState(0);
  const [reload, setReload] = React.useState(0);

  // Goal setup form
  const [objective, setObjective] = React.useState("MAINTENANCE");
  const [age, setAge] = React.useState("");
  const [sex, setSex] = React.useState<"MALE" | "FEMALE">("MALE");
  const [activity, setActivity] = React.useState("MODERATE");
  const [savingGoal, setSavingGoal] = React.useState(false);

  // Food search
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FoodItem[]>([]);
  const [searchState, setSearchState] = React.useState<
    "idle" | "loading" | "unconfigured" | "done"
  >("idle");
  const [meal, setMeal] = React.useState("BREAKFAST");

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [g, l, h] = await Promise.all([
          fetch("/api/nutrition/goal").then((r) => r.json()),
          fetch("/api/nutrition/log").then((r) => r.json()),
          fetch("/api/nutrition/hydration").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setGoal(g.goal ?? null);
        setLogs(l.logs ?? []);
        setTotals(l.totals ?? totals);
        setHydrationMl(h.totalMl ?? 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  async function saveGoal() {
    setSavingGoal(true);
    try {
      const res = await fetch("/api/nutrition/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective,
          age: age ? Number(age) : undefined,
          sex,
          activityLevel: activity,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        goal?: Goal;
        note?: string | null;
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        toast(data?.error?.message ?? "No se pudo calcular el plan.", "error");
        return;
      }
      setGoal(data?.goal ?? null);
      if (data?.note) toast(data.note, "info", 6000);
      else toast("Plan nutricional calculado.", "success");
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSavingGoal(false);
    }
  }

  async function runSearch() {
    if (query.trim().length < 2) return;
    setSearchState("loading");
    try {
      const res = await fetch(
        `/api/nutrition/search?q=${encodeURIComponent(query)}`,
      );
      const data = (await res.json()) as {
        configured: boolean;
        items: FoodItem[];
      };
      if (!data.configured) {
        setSearchState("unconfigured");
        setResults([]);
        return;
      }
      setResults(data.items);
      setSearchState("done");
    } catch {
      setSearchState("done");
      setResults([]);
    }
  }

  async function logFood(item: FoodItem, grams: number) {
    try {
      const res = await fetch("/api/nutrition/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: meal,
          name: item.name,
          sourceRef: item.sourceRef,
          quantityG: grams,
          per100g: item.per100g,
        }),
      });
      if (!res.ok) {
        toast("No se pudo registrar el alimento.", "error");
        return;
      }
      toast("Alimento registrado.", "success");
      setReload((k) => k + 1);
    } catch {
      toast("Error de red.", "error");
    }
  }

  async function deleteLog(id: string) {
    await fetch(`/api/nutrition/log/${id}`, { method: "DELETE" }).catch(() => null);
    setReload((k) => k + 1);
  }

  async function addWater(ml: number) {
    try {
      const res = await fetch("/api/nutrition/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: ml }),
      });
      const data = (await res.json()) as { totalMl: number };
      setHydrationMl(data.totalMl);
    } catch {
      toast("Error de red.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Goal / targets */}
      {goal ? (
        <Card variant="glass" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Hoy</CardTitle>
            <span className="text-accent text-sm font-semibold tabular-nums">
              {Math.round(totals.calories)}/{goal.calories} kcal
            </span>
          </div>
          <MacroBar label="Proteína" value={totals.proteinG} target={goal.proteinG} unit="g" color="var(--color-success)" />
          <MacroBar label="Carbohidratos" value={totals.carbsG} target={goal.carbsG} unit="g" color="var(--color-telemetry)" />
          <MacroBar label="Grasas" value={totals.fatG} target={goal.fatG} unit="g" color="var(--color-accent)" />
          <MacroBar label="Fibra" value={totals.fiberG} target={goal.fiberG} unit="g" color="var(--color-fg-muted)" />
        </Card>
      ) : null}

      {/* Goal setup */}
      <Card className="flex flex-col gap-3">
        <CardTitle>{goal ? "Recalcular plan" : "Calcula tu plan"}</CardTitle>
        <CardDescription>
          Estimamos tus necesidades con Mifflin-St Jeor. Edita después si lo necesitas.
        </CardDescription>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Edad" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <span className="text-fg text-sm font-medium">Sexo biológico</span>
            <div className="flex gap-2">
              {(["MALE", "FEMALE"] as const).map((s) => (
                <Button key={s} variant={sex === s ? "primary" : "secondary"} className="min-h-touch flex-1 text-sm" onClick={() => setSex(s)}>
                  {s === "MALE" ? "Hombre" : "Mujer"}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-xs">Nivel de actividad</span>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} className="bg-bg text-fg border-border min-h-touch rounded-xl border px-3 text-base">
            {ACTIVITIES.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-xs">Objetivo</span>
          <select value={objective} onChange={(e) => setObjective(e.target.value)} className="bg-bg text-fg border-border min-h-touch rounded-xl border px-3 text-base">
            {OBJECTIVES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </label>
        <Button onClick={saveGoal} disabled={savingGoal}>
          {savingGoal ? "Calculando…" : "Calcular plan"}
        </Button>
      </Card>

      {/* Hydration */}
      {goal ? (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Hidratación</CardTitle>
            <span className="text-telemetry text-sm font-semibold tabular-nums">
              {hydrationMl}/{goal.waterMl} ml
            </span>
          </div>
          <div className="flex gap-2">
            {[250, 500, 750].map((ml) => (
              <Button key={ml} variant="secondary" className="flex-1" onClick={() => addWater(ml)}>
                +{ml} ml
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Food search + log */}
      <Card className="flex flex-col gap-3">
        <CardTitle>Registrar alimento</CardTitle>
        <div className="flex gap-1.5">
          {MEALS.map((m) => (
            <Button key={m.v} variant={meal === m.v ? "primary" : "secondary"} className="min-h-0 h-9 flex-1 px-2 text-xs" onClick={() => setMeal(m.v)}>
              {m.l}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Busca un alimento…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} />
          <Button onClick={runSearch} disabled={searchState === "loading"}>
            {searchState === "loading" ? "…" : "Buscar"}
          </Button>
        </div>

        {searchState === "unconfigured" ? (
          <div className="border-accent/40 bg-accent/10 rounded-xl border p-3">
            <p className="text-fg text-sm font-medium">Fuente de alimentos sin configurar</p>
            <p className="text-fg-muted text-xs">
              La búsqueda requiere configurar un proveedor (Open Food Facts o USDA) en las variables de entorno. Mientras tanto, no mostramos datos inventados.
            </p>
          </div>
        ) : null}

        {results.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {results.map((item) => (
              <li key={item.sourceRef} className="border-border flex items-center justify-between gap-2 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-fg truncate text-sm font-medium">{item.name}</p>
                  <p className="text-fg-muted text-xs tabular-nums">
                    {Math.round(item.per100g.calories)} kcal · P{Math.round(item.per100g.proteinG)} C{Math.round(item.per100g.carbsG)} G{Math.round(item.per100g.fatG)} /100g
                  </p>
                </div>
                <Button variant="secondary" className="min-h-0 h-9 shrink-0 px-3 text-xs" onClick={() => logFood(item, 100)}>
                  + 100 g
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {/* Today's log */}
      {logs.length > 0 ? (
        <Card className="flex flex-col gap-2">
          <CardTitle>Comidas de hoy</CardTitle>
          <ul className="flex flex-col gap-1.5">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="text-fg truncate">{l.name}</p>
                  <p className="text-fg-muted text-xs tabular-nums">
                    {Math.round(l.quantityG)} g · {Math.round(l.calories)} kcal
                  </p>
                </div>
                <button onClick={() => deleteLog(l.id)} className="text-danger shrink-0 text-xs" aria-label="Eliminar">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
