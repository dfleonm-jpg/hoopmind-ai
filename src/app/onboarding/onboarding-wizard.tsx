"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { ProfileInputSchema, type ProfileInput } from "@/lib/validation/profile";
import {
  FORMAT_OPTIONS,
  GOAL_OPTIONS,
  HANDEDNESS_OPTIONS,
  LEVEL_OPTIONS,
  POSITION_OPTIONS,
} from "@/lib/validation/profile-options";

type Draft = {
  heightCm: string;
  weightKg: string;
  position?: ProfileInput["position"];
  format?: ProfileInput["format"];
  handedness?: ProfileInput["handedness"];
  level?: ProfileInput["level"];
  goals: ProfileInput["goals"];
};

const STEPS = ["Físico", "Juego", "Objetivos"] as const;

function emptyDraft(initial?: ProfileInput | null): Draft {
  return {
    heightCm: initial ? String(initial.heightCm) : "",
    weightKg: initial ? String(initial.weightKg) : "",
    position: initial?.position,
    format: initial?.format,
    handedness: initial?.handedness,
    level: initial?.level,
    goals: initial?.goals ?? [],
  };
}

function Choice<T extends string>({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-h-touch rounded-xl border px-4 text-sm font-semibold transition-colors",
        selected
          ? "bg-accent text-on-accent border-accent"
          : "bg-card text-fg border-border hover:border-accent",
      )}
    >
      {label}
    </button>
  );
}

export function OnboardingWizard({
  initialProfile,
  isEdit,
}: {
  initialProfile: ProfileInput | null;
  isEdit: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialProfile));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function toggleGoal(goal: ProfileInput["goals"][number]) {
    setDraft((d) => {
      const has = d.goals.includes(goal);
      const goals = has
        ? d.goals.filter((g) => g !== goal)
        : d.goals.length < 4
          ? [...d.goals, goal]
          : d.goals;
      return { ...d, goals };
    });
    setError(null);
  }

  // Per-step gate: block advancing when the current step is invalid (Req. 2.2).
  function validateStep(index: number): string | null {
    if (index === 0) {
      const h = Number(draft.heightCm);
      const w = Number(draft.weightKg);
      if (!Number.isInteger(h) || h < 120 || h > 240)
        return "Introduce una altura entre 120 y 240 cm.";
      if (!Number.isInteger(w) || w < 30 || w > 200)
        return "Introduce un peso entre 30 y 200 kg.";
    }
    if (index === 1) {
      if (!draft.position) return "Selecciona tu posición.";
      if (!draft.format) return "Selecciona tu formato preferido.";
      if (!draft.handedness) return "Selecciona tu mano dominante.";
      if (!draft.level) return "Selecciona tu nivel.";
    }
    if (index === 2) {
      if (draft.goals.length < 1) return "Selecciona al menos un objetivo.";
    }
    return null;
  }

  function next() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    for (let i = 0; i < STEPS.length; i++) {
      const msg = validateStep(i);
      if (msg) {
        setStep(i);
        setError(msg);
        return;
      }
    }

    const candidate = {
      heightCm: Number(draft.heightCm),
      weightKg: Number(draft.weightKg),
      position: draft.position,
      format: draft.format,
      handedness: draft.handedness,
      level: draft.level,
      goals: draft.goals,
    };

    const parsed = ProfileInputSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? "No se pudo guardar el perfil.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Progreso">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1">
            <span
              className={cn(
                "h-1.5 rounded-full",
                i <= step ? "bg-accent" : "bg-border",
              )}
            />
            <span
              className={cn(
                "text-xs",
                i === step ? "text-fg" : "text-fg-muted",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-5">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Input
              label="Altura (cm)"
              type="number"
              inputMode="numeric"
              min={120}
              max={240}
              value={draft.heightCm}
              onChange={(e) => set("heightCm", e.target.value)}
            />
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="numeric"
              min={30}
              max={200}
              value={draft.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-fg mb-1 text-sm font-medium">
                Posición
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {POSITION_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    label={o.label}
                    selected={draft.position === o.value}
                    onSelect={() => set("position", o.value)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-fg mb-1 text-sm font-medium">
                Formato preferido
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    label={o.label}
                    selected={draft.format === o.value}
                    onSelect={() => set("format", o.value)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-fg mb-1 text-sm font-medium">
                Mano dominante
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {HANDEDNESS_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    label={o.label}
                    selected={draft.handedness === o.value}
                    onSelect={() => set("handedness", o.value)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-fg mb-1 text-sm font-medium">
                Nivel
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_OPTIONS.map((o) => (
                  <Choice
                    key={o.value}
                    label={o.label}
                    selected={draft.level === o.value}
                    onSelect={() => set("level", o.value)}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-fg mb-1 text-sm font-medium">
              Objetivos (1–4)
            </legend>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((o) => (
                <Choice
                  key={o.value}
                  label={o.label}
                  selected={draft.goals.includes(o.value)}
                  onSelect={() => toggleGoal(o.value)}
                />
              ))}
            </div>
            <p className="text-fg-muted text-xs">
              {draft.goals.length} seleccionado(s).
            </p>
          </fieldset>
        )}

        {error ? (
          <p
            role="alert"
            className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={back} className="flex-1">
              Atrás
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1">
              Siguiente
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="flex-1">
              {submitting
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Terminar"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
