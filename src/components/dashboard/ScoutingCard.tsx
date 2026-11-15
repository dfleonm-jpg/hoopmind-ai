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

export function ScoutingCard({ data }: { data: Gamification }) {
  function shareCard() {
    renderCardPng(data);
  }

  return (
    <Card variant="glass" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <CardTitle>Carta de jugador</CardTitle>
          <span className="text-accent text-sm font-semibold">
            {data.archetype.label}
          </span>
        </div>
        {/* OVR badge */}
        <div className="border-accent/50 bg-accent/10 flex flex-col items-center rounded-xl border px-3 py-1">
          <span className="text-accent text-3xl font-extrabold tabular-nums leading-none">
            {data.ovr}
          </span>
          <span className="text-fg-muted text-[10px] font-semibold tracking-widest">
            OVR
          </span>
        </div>
      </div>

      {/* Attributes */}
      <ul className="grid grid-cols-4 gap-2">
        {ATTR_LABELS.map((a) => (
          <li
            key={a.key}
            className="border-border flex flex-col items-center rounded-xl border py-2"
          >
            <span className="text-telemetry text-xl font-extrabold tabular-nums">
              {data.attributes[a.key]}
            </span>
            <span className="text-fg-muted text-[10px] font-semibold tracking-widest">
              {a.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-xs">
          Nivel {data.level} · {data.xp} XP
        </span>
        <Button
          variant="secondary"
          className="min-h-0 h-9 px-3 text-sm"
          onClick={shareCard}
        >
          Compartir carta
        </Button>
      </div>

      {/* XP / level progress bar */}
      <div className="flex flex-col gap-1">
        <div className="bg-border h-2 w-full overflow-hidden rounded-full">
          <motion.div
            className="bg-success h-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(data.levelProgressPct * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center ${
                b.unlocked
                  ? "border-accent/40 bg-accent/10"
                  : "border-border opacity-50"
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
