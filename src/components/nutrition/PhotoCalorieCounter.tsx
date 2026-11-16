"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

/**
 * Camera calorie counter (v5): snap or pick a meal photo, let the AI estimate
 * the foods and macros, then review/adjust and log each item. Estimates are
 * clearly labeled — never presented as exact measurements.
 */

type Confidence = "LOW" | "MEDIUM" | "HIGH";

interface Per100g {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}
interface EstimateItem {
  name: string;
  quantityG: number;
  per100g: Per100g;
  scaled: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
  confidence: Confidence;
}
interface EstimateResponse {
  isFood: boolean;
  items: EstimateItem[];
  totalCalories: number;
  note: string | null;
  disclaimer: string;
  error?: { message?: string };
}

const MEALS = [
  { v: "BREAKFAST", l: "Desayuno" },
  { v: "LUNCH", l: "Comida" },
  { v: "DINNER", l: "Cena" },
  { v: "SNACK", l: "Snack" },
];

const CONFIDENCE_LABEL: Record<Confidence, { label: string; cls: string }> = {
  HIGH: { label: "Confianza alta", cls: "text-success border-success/40 bg-success/10" },
  MEDIUM: { label: "Confianza media", cls: "text-accent border-accent/40 bg-accent/10" },
  LOW: { label: "Confianza baja", cls: "text-danger border-danger/40 bg-danger/10" },
};

/** Downscale a picked image to a max dimension and re-encode as JPEG data URL. */
async function fileToScaledDataUrl(file: File, maxDim = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoCalorieCounter({ onLogged }: { onLogged?: () => void }) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<EstimateResponse | null>(null);
  const [items, setItems] = React.useState<EstimateItem[]>([]);
  const [meal, setMeal] = React.useState("LUNCH");
  const [logged, setLogged] = React.useState<Set<number>>(new Set());

  function reset() {
    setPreview(null);
    setResult(null);
    setItems([]);
    setLogged(new Set());
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setItems([]);
    setLogged(new Set());

    let dataUrl: string;
    try {
      dataUrl = await fileToScaledDataUrl(file);
    } catch {
      toast("No se pudo procesar la imagen.", "error");
      return;
    }
    setPreview(dataUrl);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/nutrition/photo-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json().catch(() => null)) as EstimateResponse | null;
      if (!res.ok || !data) {
        toast(data?.error?.message ?? "No se pudo analizar la foto.", "error");
        return;
      }
      setResult(data);
      setItems(data.items);
      if (!data.isFood) toast(data.note ?? "No detectamos comida.", "info", 5000);
    } catch {
      toast("Error de red. Inténtalo de nuevo.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  /** Re-scale macros when the user edits an item's quantity. */
  function setQuantity(idx: number, grams: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const f = grams / 100;
        return {
          ...it,
          quantityG: grams,
          scaled: {
            calories: Math.round(it.per100g.calories * f * 10) / 10,
            proteinG: Math.round(it.per100g.proteinG * f * 10) / 10,
            carbsG: Math.round(it.per100g.carbsG * f * 10) / 10,
            fatG: Math.round(it.per100g.fatG * f * 10) / 10,
            fiberG: Math.round(it.per100g.fiberG * f * 10) / 10,
          },
        };
      }),
    );
  }

  async function logItem(idx: number) {
    const it = items[idx];
    if (!it) return;
    try {
      const res = await fetch("/api/nutrition/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: meal,
          name: it.name,
          quantityG: it.quantityG,
          per100g: it.per100g,
        }),
      });
      if (!res.ok) {
        toast("No se pudo registrar el alimento.", "error");
        return;
      }
      setLogged((prev) => new Set(prev).add(idx));
      toast(`${it.name} registrado.`, "success");
      onLogged?.();
    } catch {
      toast("Error de red.", "error");
    }
  }

  async function logAll() {
    for (let i = 0; i < items.length; i++) {
      if (!logged.has(i)) await logItem(i);
    }
  }

  const totalCalories = Math.round(items.reduce((s, it) => s + it.scaled.calories, 0));
  const allLogged = items.length > 0 && logged.size === items.length;

  return (
    <Card variant="glass" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-accent text-[11px] font-semibold tracking-widest uppercase">
            Contador por cámara · IA
          </span>
          <CardTitle className="text-lg">Escanea tu comida</CardTitle>
        </div>
        {result ? (
          <Button variant="ghost" className="min-h-0 h-8 px-3 text-xs" onClick={reset}>
            Otra foto
          </Button>
        ) : null}
      </div>

      {!result ? (
        <CardDescription>
          Toma o sube una foto de tu plato y la IA estimará los alimentos y
          calorías. Las cifras son aproximadas: revísalas antes de registrar.
        </CardDescription>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={onPick}
      />

      {preview ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={preview}
          alt="Foto de la comida"
          className="border-border max-h-56 w-full rounded-xl border object-cover"
        />
      ) : null}

      {!result && !analyzing ? (
        <Button className="w-full" onClick={() => inputRef.current?.click()}>
          Tomar / subir foto
        </Button>
      ) : null}

      {analyzing ? (
        <div className="border-accent/40 bg-accent/10 text-fg-muted flex items-center gap-2 rounded-xl border p-3 text-sm">
          <span className="border-accent size-4 animate-spin rounded-full border-2 border-t-transparent" />
          Analizando la foto…
        </div>
      ) : null}

      <AnimatePresence>
        {result && items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Meal selector */}
            <div className="flex gap-1.5">
              {MEALS.map((m) => (
                <Button
                  key={m.v}
                  variant={meal === m.v ? "primary" : "secondary"}
                  className="min-h-0 h-9 flex-1 px-2 text-xs"
                  onClick={() => setMeal(m.v)}
                >
                  {m.l}
                </Button>
              ))}
            </div>

            <ul className="flex flex-col gap-2">
              {items.map((it, idx) => {
                const conf = CONFIDENCE_LABEL[it.confidence];
                const done = logged.has(idx);
                return (
                  <li
                    key={`${it.name}-${idx}`}
                    className="border-border flex flex-col gap-2 rounded-xl border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-fg truncate text-sm font-medium">{it.name}</p>
                        <p className="text-fg-muted text-xs tabular-nums">
                          ~{Math.round(it.scaled.calories)} kcal · P
                          {Math.round(it.scaled.proteinG)} C{Math.round(it.scaled.carbsG)} G
                          {Math.round(it.scaled.fatG)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${conf.cls}`}
                      >
                        {conf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-fg-muted flex items-center gap-1 text-xs">
                        Cantidad
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={3000}
                          value={it.quantityG}
                          onChange={(e) =>
                            setQuantity(idx, Math.max(1, Number(e.target.value) || 1))
                          }
                          className="bg-bg text-fg border-border h-9 w-20 rounded-lg border px-2 text-sm tabular-nums"
                        />
                        g
                      </label>
                      <Button
                        variant={done ? "secondary" : "primary"}
                        disabled={done}
                        className="min-h-0 ml-auto h-9 px-3 text-xs"
                        onClick={() => logItem(idx)}
                      >
                        {done ? "Registrado ✓" : "Registrar"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-fg-muted text-xs tabular-nums">
                Total estimado: ~{totalCalories} kcal
              </span>
              <Button
                variant="secondary"
                className="min-h-0 h-9 px-3 text-xs"
                disabled={allLogged}
                onClick={logAll}
              >
                {allLogged ? "Todo registrado" : "Registrar todo"}
              </Button>
            </div>

            <p className="text-fg-muted border-border/60 rounded-lg border border-dashed p-2 text-[11px] leading-relaxed">
              {result.disclaimer}
              {result.note ? ` ${result.note}` : ""}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
