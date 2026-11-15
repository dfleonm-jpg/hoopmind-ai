"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Category = "SKINCARE" | "HAIRCARE" | "GROOMING" | "POSTURE";

interface Routine {
  id: string;
  category: Category;
  title: string;
  steps: string[];
  timeOfDay: string | null;
}

const CATEGORIES: { v: Category; l: string; desc: string }[] = [
  { v: "SKINCARE", l: "Skincare", desc: "Limpieza, hidratación y protección solar." },
  { v: "HAIRCARE", l: "Cabello", desc: "Lavado, cuidado del cuero cabelludo y mantenimiento." },
  { v: "GROOMING", l: "Grooming", desc: "Higiene, barba y cuidado personal." },
  { v: "POSTURE", l: "Postura", desc: "Hábitos posturales, movilidad y ergonomía." },
];

export function GlowUpWorkspace() {
  const { toast } = useToast();
  const [routines, setRoutines] = React.useState<Routine[]>([]);
  const [category, setCategory] = React.useState<Category>("SKINCARE");
  const [reload, setReload] = React.useState(0);

  const [title, setTitle] = React.useState("");
  const [stepsText, setStepsText] = React.useState("");
  const [timeOfDay, setTimeOfDay] = React.useState<"AM" | "PM" | "">("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/care");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { routines: Routine[] };
          setRoutines(data.routines);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function save() {
    const steps = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (title.trim().length < 2 || steps.length === 0) {
      toast("Añade un título y al menos un paso.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          steps,
          timeOfDay: timeOfDay || undefined,
        }),
      });
      if (!res.ok) {
        toast("No se pudo guardar la rutina.", "error");
        return;
      }
      setTitle("");
      setStepsText("");
      setTimeOfDay("");
      setReload((k) => k + 1);
      toast("Rutina guardada.", "success");
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/care/${id}`, { method: "DELETE" }).catch(() => null);
    setReload((k) => k + 1);
  }

  const visible = routines.filter((r) => r.category === category);
  const activeCat = CATEGORIES.find((c) => c.v === category)!;

  return (
    <div className="flex flex-col gap-5">
      <Card variant="glass" className="flex flex-col gap-2">
        <CardTitle>Glow Up</CardTitle>
        <CardDescription>
          Construye rutinas de cuidado personal realistas y sostenibles. Sin
          promesas milagrosas ni puntuaciones de apariencia.
        </CardDescription>
      </Card>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Categoría">
        {CATEGORIES.map((c) => (
          <Button
            key={c.v}
            variant={category === c.v ? "primary" : "secondary"}
            className="min-h-0 h-10 shrink-0 px-3 text-sm"
            onClick={() => setCategory(c.v)}
          >
            {c.l}
          </Button>
        ))}
      </div>

      <p className="text-fg-muted text-sm">{activeCat.desc}</p>

      {/* Existing routines */}
      {visible.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-fg font-semibold">{r.title}</p>
                    {r.timeOfDay ? (
                      <span className="text-accent text-xs font-semibold">
                        {r.timeOfDay === "AM" ? "Mañana" : "Noche"}
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-danger shrink-0 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
                <ol className="flex list-decimal flex-col gap-1 pl-5">
                  {r.steps.map((s, i) => (
                    <li key={i} className="text-fg-muted text-sm">{s}</li>
                  ))}
                </ol>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <p className="text-fg-muted text-sm">
            Aún no tienes rutinas de {activeCat.l.toLowerCase()}.
          </p>
        </Card>
      )}

      {/* Create routine */}
      <Card className="flex flex-col gap-3">
        <CardTitle>Nueva rutina de {activeCat.l.toLowerCase()}</CardTitle>
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="p. ej. Rutina de mañana"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-sm font-medium">Pasos (uno por línea)</span>
          <textarea
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            rows={4}
            className="bg-bg text-fg border-border rounded-xl border px-3 py-2 text-base"
            placeholder={"Limpiador suave\nHidratante\nProtector solar SPF 30+"}
          />
        </label>
        {category === "SKINCARE" || category === "HAIRCARE" ? (
          <div className="flex gap-2" role="group" aria-label="Momento del día">
            {(["AM", "PM"] as const).map((t) => (
              <Button
                key={t}
                variant={timeOfDay === t ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setTimeOfDay(timeOfDay === t ? "" : t)}
              >
                {t === "AM" ? "Mañana" : "Noche"}
              </Button>
            ))}
          </div>
        ) : null}
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar rutina"}
        </Button>
      </Card>
    </div>
  );
}
