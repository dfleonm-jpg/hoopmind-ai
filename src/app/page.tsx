import Link from "next/link";
import { connection } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MiniCourtPreview } from "@/components/landing/MiniCourtPreview";

// Reads auth cookies to target the CTA, so render dynamically.
export const instant = false;

const BENEFITS = [
  {
    title: "IA táctica 3x3 y 5v5",
    body: "Rutinas que se adaptan a tu posición, formato y rendimiento real sesión a sesión.",
    icon: "M6 7v10M18 7v10M6 12h12",
  },
  {
    title: "Shot Chart por zonas",
    body: "Mapa de calor de tu acierto por zona de la cancha, con rachas y progreso.",
    icon: "M4 20V10M10 20V4M16 20v-7M20 20H2",
  },
  {
    title: "Biomecánica con MediaPipe",
    body: "Analiza tu tiro (codo, rodillas, liberación) en tu dispositivo. El video nunca se sube.",
    icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  },
] as const;

export default async function Home() {
  await connection();
  const user = await getAuthUser();
  const ctaHref = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Ir a mi cancha" : "Empezar gratis";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pt-safe pb-10">
      {/* Hero */}
      <section className="flex flex-col gap-5 pt-8">
        <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">
          HoopMind AI · v2
        </span>
        <h1 className="text-fg text-4xl font-extrabold leading-tight tracking-tight">
          Entrena como un pro,
          <span className="text-accent"> impulsado por IA</span>
        </h1>
        <p className="text-fg-muted text-base">
          Tu coach de baloncesto personal para 5v5 y 3x3: rutinas adaptativas,
          pizarra táctica animada y análisis de tu tiro.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={ctaHref} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              {ctaLabel}
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </section>

      {/* Live tactic-board preview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-fg text-sm font-semibold tracking-widest uppercase">
            Pizarra en vivo
          </h2>
          <span className="text-success text-xs font-semibold">● Pick &amp; Roll</span>
        </div>
        <Card variant="glass" className="p-3">
          <MiniCourtPreview />
        </Card>
      </section>

      {/* Benefits */}
      <section className="flex flex-col gap-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} variant="glass" className="flex items-start gap-3">
            <span className="text-accent mt-0.5 shrink-0">
              <svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={b.icon} />
              </svg>
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">{b.title}</CardTitle>
              <CardDescription>{b.body}</CardDescription>
            </div>
          </Card>
        ))}
      </section>

      {/* Closing CTA */}
      <section>
        <Card className="flex flex-col items-center gap-3 text-center">
          <CardTitle>Tu próxima sesión te espera</CardTitle>
          <CardDescription>
            Completa tu perfil y genera tu primer entrenamiento en segundos.
          </CardDescription>
          <Link href={ctaHref} className="w-full">
            <Button size="lg" className="w-full">
              {ctaLabel}
            </Button>
          </Link>
        </Card>
      </section>
    </main>
  );
}
