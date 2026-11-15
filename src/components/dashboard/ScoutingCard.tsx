"use client";

import { motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Badge {
  id: string;
  label: string;
  unlocked: boolean;
}

export interface Gamification {
  xp: number;
  level: number;
  levelProgressPct: number; // 0..1
  xpIntoLevel: number;
  xpForNext: number;
  archetype: { id: string; label: string };
  badges: Badge[];
  ovr: number; // 60..99
  attributes: { SHT: number; "3X3": number; CON: number; BIO: number };
}

const ATTR_LABELS: { key: keyof Gamification["attributes"]; label: string }[] = [
  { key: "SHT", label: "TIRO" },
  { key: "3X3", label: "3X3" },
  { key: "CON", label: "CONST" },
  { key: "BIO", label: "BIO" },
];

const ATTR_COLOR: Record<string, string> = {
  SHT: "var(--color-accent)",
  "3X3": "var(--color-telemetry)",
  CON: "var(--color-success)",
  BIO: "var(--color-violet)",
};

/** Radial OVR ring with glowing gradient stroke. */
function OvrRing({ ovr }: { ovr: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  // 60..99 mapped to 0..1 of the ring.
  const pct = Math.min(1, Math.max(0, (ovr - 60) / 39));
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ovr-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-hover)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <motion.circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke="url(#ovr-grad)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--color-accent) 70%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-gradient text-glow-accent text-4xl font-black tabular-nums leading-none">
          {ovr}
        </span>
        <span className="text-fg-muted text-[10px] font-bold tracking-[0.2em]">
          OVR
        </span>
      </div>
    </div>
  );
}

export function ScoutingCard({ data }: { data: Gamification }) {
  function shareCard() {
    renderCardPng(data);
  }

  return (
    <Card
      variant="glass"
      className="relative flex flex-col gap-4 overflow-hidden"
    >
      {/* ambient glow behind the OVR */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--color-accent)" }}
      />

      <div className="relative flex items-center gap-4">
        <OvrRing ovr={data.ovr} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-fg-muted text-[11px] font-semibold tracking-widest uppercase">
            Carta de jugador
          </span>
          <CardTitle className="text-gradient text-xl leading-tight">
            {data.archetype.label}
          </CardTitle>
          <span className="text-fg-muted text-xs tabular-nums">
            Nivel {data.level} · {data.xp} XP
          </span>
        </div>
      </div>

      {/* Attribute mini-bars */}
      <ul className="grid grid-cols-2 gap-2.5">
        {ATTR_LABELS.map((a) => {
          const val = data.attributes[a.key];
          const color = ATTR_COLOR[a.key] ?? "var(--color-fg)";
          return (
            <li key={a.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-fg-muted text-[10px] font-bold tracking-widest">
                  {a.label}
                </span>
                <span
                  className="text-sm font-extrabold tabular-nums"
                  style={{ color }}
                >
                  {val}
                </span>
              </div>
              <div className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((val - 60) / 39) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* XP / level progress */}
      <div className="flex flex-col gap-1">
        <div className="bg-border/60 h-2 w-full overflow-hidden rounded-full">
          <motion.div
            className="from-success-dim to-success h-full rounded-full bg-gradient-to-r"
            style={{ boxShadow: "0 0 10px var(--color-success)" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(data.levelProgressPct * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-fg-muted text-[11px] tabular-nums">
          {data.xpForNext > 0
            ? `${data.xpIntoLevel}/${data.xpForNext} XP para el nivel ${data.level + 1}`
            : "Nivel máximo"}
        </span>
      </div>

      {/* Badges */}
      <div>
        <p className="text-fg-muted mb-2 text-xs font-semibold tracking-widest uppercase">
          Insignias
        </p>
        <ul className="grid grid-cols-3 gap-2">
          {data.badges.map((b) => (
            <li
              key={b.id}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors ${
                b.unlocked
                  ? "border-accent/40 bg-accent/10 glow-accent"
                  : "border-border opacity-40"
              }`}
              aria-label={`${b.label}: ${b.unlocked ? "desbloqueada" : "bloqueada"}`}
            >
              <span className="text-lg" aria-hidden>
                {b.unlocked ? "🏅" : "🔒"}
              </span>
              <span className="text-fg text-[11px] leading-tight">
                {b.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="secondary" className="w-full" onClick={shareCard}>
        Compartir carta ↗
      </Button>
    </Card>
  );
}

/**
 * Renders the player card to a <canvas> and triggers a PNG download.
 * Native canvas only — no heavy dependencies (v3).
 */
function renderCardPng(data: Gamification) {
  const W = 720;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#121216");
  grad.addColorStop(1, "#0A0A0C");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Accent frame
  ctx.strokeStyle = "#FF5E1A";
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Brand
  ctx.fillStyle = "#FF5E1A";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HOOPMIND AI", 56, 92);

  // OVR big
  ctx.textAlign = "center";
  ctx.fillStyle = "#F5F6F7";
  ctx.font = "bold 220px sans-serif";
  ctx.fillText(String(data.ovr), W / 2, 360);
  ctx.fillStyle = "#AEB2B8";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("OVR", W / 2, 410);

  // Archetype
  ctx.fillStyle = "#FF5E1A";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(data.archetype.label.toUpperCase(), W / 2, 480);

  // Attributes row
  const attrs: [string, number][] = [
    ["TIRO", data.attributes.SHT],
    ["3X3", data.attributes["3X3"]],
    ["CONST", data.attributes.CON],
    ["BIO", data.attributes.BIO],
  ];
  const colW = (W - 112) / 4;
  attrs.forEach(([label, val], i) => {
    const cx = 56 + colW * i + colW / 2;
    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText(String(val), cx, 640);
    ctx.fillStyle = "#AEB2B8";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(label, cx, 686);
  });

  // Level + XP
  ctx.fillStyle = "#F5F6F7";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(`NIVEL ${data.level}`, W / 2, 800);
  ctx.fillStyle = "#22C55E";
  ctx.font = "28px sans-serif";
  ctx.fillText(`${data.xp} XP`, W / 2, 846);

  // Badges unlocked count
  const unlocked = data.badges.filter((b) => b.unlocked).length;
  ctx.fillStyle = "#AEB2B8";
  ctx.font = "26px sans-serif";
  ctx.fillText(`${unlocked}/${data.badges.length} insignias`, W / 2, 920);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hoopmind-carta.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
