import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <span className="text-accent text-sm font-semibold tracking-widest uppercase">
          HoopMind AI
        </span>
        <h1 className="text-fg text-2xl font-bold tracking-tight">
          Entra a tu cancha
        </h1>
        <p className="text-fg-muted text-sm">
          Rutinas con IA, pizarra táctica y tu shot chart, en un solo lugar.
        </p>
      </header>

      <LoginForm />
    </main>
  );
}
