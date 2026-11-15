import Link from "next/link";
import { connection } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LandingHero } from "@/components/landing/LandingHero";

// Reads auth cookies to target the CTA, so render dynamically.
export const instant = false;

const PILLARS = [
  {
    title: "AI Coach",
    body: "6 especialistas que leen tus datos reales y te guían sesión a sesión.",
    icon: "M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 21a7 7 0 0 1 14 0",
    tint: "var(--color-accent)",
  },
  {
    title: "Body Transformation",
    body: "Mapa muscular, cargas, PRs y recuperación por grupo en tiempo real.",
    icon: "M6 7v10M18 7v10M6 12h12M3 9v6M21 9v6",
    tint: "var(--color-success)",
  },
  {
    title: "Pliometría & salto",
    body: "Laboratorio de explosividad con contactos seguros por tu peso.",
    icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z",
    tint: "var(--color-violet)",
  },
  {
    title: "Biomecánica",
    body: "Form check de tiro y gym por cámara, en tu dispositivo. Privado.",
    icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
    tint: "var(--color-telemetry)",
  },
] as const;

const STATS = [
  { k: "56", l: "ejercicios" },
  { k: "8", l: "drills pliométricos" },
  { k: "60–99", l: "OVR real" },
] as const;

export default async function Home() {
  await connection();
  const user = await getAuthUser();
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Ir a mi cancha" : "Empezar gratis";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-4 pt-safe pb-14">
      <LandingHero ctaHref={ctaHref} ctaLabel={ctaLabel} />

      {/* Stats strip */}
      <section className="glass flex items-center justify-around rounded-2xl py-4">
        {STATS.map((s) => (
          <div key={s.l} className="flex flex-col items-center">
            <span className="text-gradient text-2xl font-black tabular-nums">
              {s.k}
            </span>
            <span className="text-fg-muted text-[11px] tracking-wide">{s.l}</span>
          </div>
        ))}
      </section>

      {/* Pillars */}
      <section className="flex flex-col gap-4">
        <h2 className="text-fg text-xl font-bold tracking-tight">
          Un ecosistema, no una app de fitness
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PILLARS.map((p) => (
            <Card key={p.title} variant="glass" className="flex flex-col gap-2">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  color: p.tint,
                  background: `color-mix(in srgb, ${p.tint} 14%, transparent)`,
                  boxShadow: `0 0 24px -8px ${p.tint}`,
                }}
              >
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={p.icon} />
                </svg>
              </span>
              <CardTitle className="text-sm">{p.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {p.body}
              </CardDescription>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <Card
          variant="glass"
          className="flex flex-col items-center gap-3 overflow-hidden text-center glow-accent"
        >
          <CardTitle className="text-xl">Tu transformación empieza hoy</CardTitle>
          <CardDescription>
            Completa tu perfil y genera tu primer plan en segundos.
          </CardDescription>
          <Link href={ctaHref} className="w-full">
            <Button size="lg" className="w-full">
              {ctaLabel} →
            </Button>
          </Link>
        </Card>
      </section>

      <p className="text-fg-muted/60 text-center text-[11px]">
        HoopMind · Become Unstoppable
      </p>
    </main>
  );
}
