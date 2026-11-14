"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signIn,
  signUp,
  type AuthActionState,
} from "@/app/(auth)/login/actions";

const initialState: AuthActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Un momento…" : label}
    </Button>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Modo de autenticación"
        className="bg-card border-border flex rounded-xl border p-1"
      >
        <button
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          className={`min-h-touch flex-1 rounded-lg text-sm font-semibold transition-colors ${
            mode === "signin" ? "bg-accent text-on-accent" : "text-fg-muted"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          className={`min-h-touch flex-1 rounded-lg text-sm font-semibold transition-colors ${
            mode === "signup" ? "bg-accent text-on-accent" : "text-fg-muted"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete={
            mode === "signin" ? "current-password" : "new-password"
          }
          required
          placeholder="••••••••"
          hint={mode === "signup" ? "Mínimo 8 caracteres." : undefined}
        />

        {state.error ? (
          <p
            role="alert"
            className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm"
          >
            {state.error}
          </p>
        ) : null}

        <SubmitButton
          label={mode === "signin" ? "Entrar" : "Registrarme"}
        />
      </form>
    </div>
  );
}
