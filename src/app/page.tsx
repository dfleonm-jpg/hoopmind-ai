import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-accent text-sm font-semibold tracking-widest uppercase">
          HoopMind AI
        </span>
        <h1 className="text-fg text-3xl font-bold tracking-tight">
          Entrena como un pro, impulsado por IA
        </h1>
        <p className="text-fg-muted text-base">
          Rutinas personalizadas para 5v5 y 3x3, pizarra táctica animada y
          seguimiento de tu tiro por zonas.
        </p>
      </header>

      <Card className="flex flex-col gap-3">
        <CardTitle>Empieza en cancha</CardTitle>
        <CardDescription>
          Completa tu perfil y genera tu primera sesión en segundos.
        </CardDescription>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto">
            Crear cuenta
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            Iniciar sesión
          </Button>
        </div>
      </Card>
    </main>
  );
}
