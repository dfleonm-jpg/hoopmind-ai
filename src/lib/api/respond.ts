import { NextResponse } from "next/server";

/** Standard error envelope: { error: { code, message } }. */
export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthorized() {
  return apiError("UNAUTHORIZED", "No autenticado.", 401);
}

export function notFound(message = "No encontrado.") {
  return apiError("NOT_FOUND", message, 404);
}

export function badRequest(message = "Solicitud inválida.") {
  return apiError("BAD_REQUEST", message, 400);
}
