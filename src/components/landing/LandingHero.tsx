"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MiniCourtPreview } from "@/components/landing/MiniCourtPreview";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function LandingHero({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <section className="relative flex flex-col gap-6 pt-10">
      {/* Decorative spinning conic glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 opacity-40 blur-2xl"
      >
        <div
          className="ring-spin h-full w-full rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, var(--color-accent), transparent 35%, var(--color-telemetry) 60%, transparent 85%, var(--color-accent))",
          }}
        />
      </div>

      <motion.div
        custom={0}
        variants={fade}
        initial="hidden"
        animate="show"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
      >
        <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
        <span className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
          HoopMind · Become Unstoppable
        </span>
      </motion.div>

      <motion.h1
        custom={1}
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-5xl font-black leading-[0.98] tracking-tight"
      >
        <span className="text-fg">Entrena como</span>
        <br />
        <span className="text-gradient text-glow-accent">un profesional.</span>
      </motion.h1>

      <motion.p
        custom={2}
        variants={fade}
        initial="hidden"
        animate="show"
        className="text-fg-muted text-base leading-relaxed"
      >
        Ecosistema de rendimiento impulsado por IA: baloncesto 5v5/3x3, gimnasio,
        pliometría, nutrición, recuperación y tu coach personal. Todo en uno.
      </motion.p>

      <motion.div
        custom={3}
        variants={fade}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Link href={ctaHref} className="w-full sm:w-auto">
          <Button size="lg" className="w-full glow-accent">
            {ctaLabel} →
          </Button>
        </Link>
        <Link href="/login" className="w-full sm:w-auto">
          <Button variant="secondary" size="lg" className="w-full">
            Iniciar sesión
          </Button>
        </Link>
      </motion.div>

      {/* Floating live tactic board */}
      <motion.div
        custom={4}
        variants={fade}
        initial="hidden"
        animate="show"
        className="float mt-2"
      >
        <div className="glass relative overflow-hidden rounded-3xl p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-fg-muted text-[11px] font-semibold tracking-widest uppercase">
              Pizarra en vivo
            </span>
            <span className="text-success flex items-center gap-1 text-[11px] font-semibold">
              <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
              Pick &amp; Roll
            </span>
          </div>
          <MiniCourtPreview />
        </div>
      </motion.div>
    </section>
  );
}
