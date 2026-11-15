"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PlyoVisualizerSVG } from "./PlyoVisualizerSVG";
import {
  PLYO_CATALOG,
  safeContactsPerSession,
  type PlyoDrill,
} from "@/lib/plyo/catalog";
import { playCue, unlockAudio } from "@/lib/audio/feedback";

export function PlyoLab({ weightKg }: { weightKg: number }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState<PlyoDrill | null>(null);

  // Session contact tracking across the whole lab visit.
  const safeMax = safeContactsPerSession(weightKg);
  const [contacts, setContacts] = React.useState(0);
  const [usedDrills, setUsedDrills] = React.useState<Set<string>>(new Set());
  const [startedAt] = React.useState(() => Date.now());
  const [saving, setSaving] = React.useState(false);

  const ratio = contacts / safeMax;
  const zone = ratio >= 1 ? "red" : ratio >= 0.75 ? "amber" : "green";
  const zoneColor =
    zone === "red" ? "var(--color-danger)" : zone === "amber" ? "var(--color-accent)" : "var(--color-success)";

  function addContacts(n: number, slug: string) {
    unlockAudio();
    playCue("made");
    setContacts((c) => c + n);
    setUsedDrills((prev) => new Set(prev).add(slug));
  }

  async function finishSession() {
    if (contacts === 0) {
      toast("Registra algún contacto antes de guardar.", "info");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/plyo/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drills: Array.from(usedDrills),
          totalContacts: contacts,
          durationS: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        award?: { xp: number; leveledUp: boolean } | null;
      } | null;
      if (!res.ok) {
        toast("No se pudo guardar la sesión.", "error");
        return;
      }
      const lvl = data?.award?.leveledUp ? " ¡Subiste de nivel!" : "";
      toast(`Sesión de pliometría guardada.${lvl}`, "success");
      setContacts(0);
      setUsedDrills(new Set());
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Contact meter */}
      <Card variant="glass" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle>Contactos de la sesión</CardTitle>
          <span className="tabular-nums text-sm font-semibold" style={{ color: zoneColor }}>
            {contacts}/{safeMax}
          </span>
        </div>
        <div className="bg-border h-2.5 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${Math.min(100, ratio * 100)}%`, background: zoneColor }}
          />
        </div>
        <CardDescription>
          {zone === "red"
            ? "Límite seguro alcanzado para tu peso. Para proteger tus rodillas, termina la sesión."
            : zone === "amber"
              ? "Te acercas a tu límite de impactos. Baja el ritmo."
              : "Volumen seguro. Calidad sobre cantidad en cada salto."}
        </CardDescription>
        <Button onClick={finishSession} disabled={saving}>
          {saving ? "Guardando…" : "Finalizar y guardar sesión"}
        </Button>
      </Card>

      {/* Drill catalog */}
      <ul className="flex flex-col gap-3">
        {PLYO_CATALOG.map((d) => (
          <li key={d.slug}>
            <button
              onClick={() => setOpen(d)}
              className="glass hover:border-accent/60 flex w-full items-center justify-between gap-2 rounded-2xl p-4 text-left transition-colors"
            >
              <div className="min-w-0">
                <p className="text-fg font-semibold">{d.name}</p>
                <p className="text-fg-muted text-xs">{d.focus}</p>
              </div>
              <span className="text-accent shrink-0 text-sm font-semibold">Ver ›</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Drill detail drawer */}
      {open ? (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/70 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-bg border-border pb-safe max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-fg text-xl font-bold">{open.name}</h2>
                <p className="text-fg-muted text-xs">{open.focus}</p>
              </div>
              <Button variant="ghost" className="px-3" aria-label="Cerrar" onClick={() => setOpen(null)}>
                ✕
              </Button>
            </div>

            <PlyoVisualizerSVG contactMs={open.contactMs} />

            <div className="mt-3 flex flex-col gap-3">
              <p className="text-fg-muted text-sm tabular-nums">
                {open.sets} series × {open.reps} reps · descanso {open.restSeconds}s
                {open.contactMs ? ` · contacto < ${open.contactMs} ms` : ""}
              </p>
              <div>
                <h3 className="text-fg text-sm font-semibold">Errores a evitar</h3>
                <ul className="list-disc pl-5">
                  {open.mistakes.map((m, i) => (
                    <li key={i} className="text-fg-muted text-sm">{m}</li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => addContacts(open.sets * open.reps * open.contactsPerRep, open.slug)}
              >
                + Registrar serie completa ({open.sets * open.reps * open.contactsPerRep} contactos)
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
