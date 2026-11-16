import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-10">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 -z-10 h-56 w-56 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--color-accent)" }}
      />
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="from-accent-hover to-accent glow-accent float flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-black text-on-accent">
          H
        </span>
        <span className="text-accent text-[11px] font-semibold tracking-[0.25em] uppercase">
          HoopMind · Become Unstoppable
        </span>
        <h1 className="text-gradient text-3xl font-black tracking-tight">
          Entra a tu cancha
        </h1>
        <p className="text-fg-muted text-sm">
          Tu ecosistema de rendimiento con IA, en un solo lugar.
        </p>
      </header>

      <div className="glass rounded-3xl p-5">
        <LoginForm />
      </div>
    </main>
  );
}
