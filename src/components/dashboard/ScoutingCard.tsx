"use client";

import { motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";

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
}

export function ScoutingCard({ data }: { data: Gamification }) {
  return (
    <Card variant="glass" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <CardTitle>Scouting Card</CardTitle>
          <span className="text-accent text-sm font-semibold">
            {data.archetype.label}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-fg text-2xl font-extrabold tabular-nums">
            Nv {data.level}
          </span>
          <span className="text-fg-muted text-[11px]">{data.xp} XP</span>
        </div>
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
