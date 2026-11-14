"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
}

// Deliberately generic so we never reveal which field was wrong (Req. 1.3).
const GENERIC_CREDENTIALS_ERROR =
  "Credenciales incorrectas. Revisa tu email y contraseña.";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: GENERIC_CREDENTIALS_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: GENERIC_CREDENTIALS_ERROR };

  // Middleware routes to /onboarding or /dashboard based on profile state.
  redirect("/");
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: GENERIC_CREDENTIALS_ERROR };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Keep sign-up errors generic too, but surface the password-policy hint.
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  // If email confirmation is required there is no active session yet.
  if (!data.session) {
    return {
      error:
        "Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.",
    };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
