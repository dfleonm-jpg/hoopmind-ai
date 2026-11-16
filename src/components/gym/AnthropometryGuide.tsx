"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { computeAnthro, RIM_HEIGHT_CM } from "@/lib/anthropometry/calc";

interface ProfileAnthro {
  heightCm: number;
  wingspanCm: number | null;
  standingReachCm: number | null;
  inseamCm: number | null;
  femurLengthCm: number | null;
  verticalJumpCm: number | null;
}

/** Side-profile SVG showing arms outstretched (wingspan). */
function WingspanDiagram() {
  return (
    <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
      <g stroke="var(--color-telemetry)" strokeWidth={2.5} fill="none" strokeLinecap="round">
        <circle cx={100} cy={28} r={12} />
        <path d="M100 40 L100 86" />
        <path d="M10 52 L190 52" />
        <path d="M100 86 L86 104 M100 86 L114 104" />
      </g>
      <g stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4 4">
        <path d="M10 52 L10 66 M190 52 L190 66" />
      </g>
      <text x={100} y={70} textAnchor="middle" fontSize={9} fill="var(--color-fg-muted)">
        punta a punta de los dedos
      </text>
    </svg>
  );
}

/** Seated side diagram for femur / inseam measurement. */
function FemurDiagram() {
  return (
    <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
      <g stroke="var(--color-telemetry)" strokeWidth={2.5} fill="none" strokeLinecap="round">
        <circle cx={48} cy={26} r={11} />
        <path d="M48 37 L48 70" />
        <path d="M48 70 L120 70" />
        <path d="M120 70 L120 104" />
      </g>
      <g stroke="var(--color-accent)" strokeWidth={1.5}>
        <path d="M48 82 L120 82" strokeDasharray="4 4" />
      </g>
      <text x={84} y={94} textAnchor="middle" fontSize={9} fill="var(--color-fg-muted)">
        cadera → rodilla (fémur)
      </text>
    </svg>
  );
}

/** Wall reach + vertical jump diagram. */
function ReachDiagram() {
  return (
    <svg viewBox="0 0 200 120" className="w-full" aria-hidden>
      <path d="M30 6 L30 114" stroke="var(--color-border)" strokeWidth={3} />
      <g stroke="var(--color-telemetry)" strokeWidth={2.5} fill="none" strokeLinecap="round">
        <circle cx={70} cy={52} r={11} />
        <path d="M70 63 L70 98" />
        <path d="M70 70 L52 30" />
      </g>
      <line x1={30} y1={24} x2={140} y2={24} stroke="var(--color-success)" strokeWidth={1.5} strokeDasharray="4 4" />
      <line x1={30} y1={60} x2={140} y2={60} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={145} y={27} fontSize={9} fill="var(--color-success)">toque máx.</text>
      <text x={145} y={63} fontSize={9} fill="var(--color-accent)">alcance de pie</text>
    </svg>
  );
}

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function AnthropometryGuide() {
  const { toast } = useToast();
  const [height, setHeight] = React.useState(180);
  const [wingspan, setWingspan] = React.useState("");
  const [reach, setReach] = React.useState("");
  const [inseam, setInseam] = React.useState("");
  const [femur, setFemur] = React.useState("");
  const [vertical, setVertical] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/profile/anthropometry");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { profile: ProfileAnthro | null };
          const p = data.profile;
          if (p) {
            setHeight(p.heightCm);
            setWingspan(p.wingspanCm?.toString() ?? "");
            setReach(p.standingReachCm?.toString() ?? "");
            setInseam(p.inseamCm?.toString() ?? "");
            setFemur(p.femurLengthCm?.toString() ?? "");
            setVertical(p.verticalJumpCm?.toString() ?? "");
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const anthro = computeAnthro({
    heightCm: height,
    wingspanCm: num(wingspan),
    standingReachCm: num(reach),
    inseamCm: num(inseam),
    femurLengthCm: num(femur),
    verticalJumpCm: num(vertical),
  });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/anthropometry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wingspanCm: num(wingspan),
          standingReachCm: num(reach),
          inseamCm: num(inseam),
          femurLengthCm: num(femur),
          verticalJumpCm: num(vertical),
        }),
      });
      if (!res.ok) {
        toast("No se pudieron guardar las medidas.", "error");
        return;
      }
      toast("Antropometría guardada.", "success");
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Derived insights */}
      {(anthro.apeLabel || anthro.femurLabel || anthro.touchHeightCm != null) ? (
        <Card variant="glass" className="flex flex-col gap-2">
          <CardTitle>Tu perfil atlético</CardTitle>
          {anthro.apeLabel ? <p className="text-fg text-sm">🪽 {anthro.apeLabel}</p> : null}
          {anthro.femurLabel ? <p className="text-fg text-sm">🦵 {anthro.femurLabel}</p> : null}
          {anthro.touchHeightCm != null ? (
            <p className="text-fg text-sm">
              🎯 Toque máximo {anthro.touchHeightCm} cm ·{" "}
              {anthro.rimGapCm != null && anthro.rimGapCm <= 0
                ? "¡llegas al aro!"
                : `a ${anthro.rimGapCm} cm del aro (${RIM_HEIGHT_CM} cm)`}
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Wingspan */}
      <Card className="flex flex-col gap-2">
        <CardTitle className="text-base">Envergadura (Wingspan)</CardTitle>
        <CardDescription>
          Brazos en cruz. Mide de la punta de un dedo medio a la del otro.
        </CardDescription>
        <WingspanDiagram />
        <Input label="Envergadura (cm)" type="number" inputMode="numeric" value={wingspan} onChange={(e) => setWingspan(e.target.value)} />
      </Card>

      {/* Femur / inseam */}
      <Card className="flex flex-col gap-2">
        <CardTitle className="text-base">Palancas (Fémur / Entrepierna)</CardTitle>
        <CardDescription>
          Sentado, mide de la cadera a la rodilla (fémur). La entrepierna, de la
          ingle al suelo. Clasifica tus palancas para ajustar la sentadilla.
        </CardDescription>
        <FemurDiagram />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Fémur (cm)" type="number" inputMode="numeric" value={femur} onChange={(e) => setFemur(e.target.value)} />
          <Input label="Entrepierna (cm)" type="number" inputMode="numeric" value={inseam} onChange={(e) => setInseam(e.target.value)} />
        </div>
      </Card>

      {/* Reach + vertical */}
      <Card className="flex flex-col gap-2">
        <CardTitle className="text-base">Alcance y Salto Vertical</CardTitle>
        <CardDescription>
          De pie contra la pared, brazo arriba: marca el alcance. Luego salta y
          marca el toque máximo; la diferencia es tu salto vertical.
        </CardDescription>
        <ReachDiagram />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Alcance de pie (cm)" type="number" inputMode="numeric" value={reach} onChange={(e) => setReach(e.target.value)} />
          <Input label="Salto vertical (cm)" type="number" inputMode="numeric" value={vertical} onChange={(e) => setVertical(e.target.value)} />
        </div>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar medidas"}
      </Button>
    </div>
  );
}
