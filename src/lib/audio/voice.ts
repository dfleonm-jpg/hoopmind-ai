"use client";

/**
 * Coach voice via the Web Speech API (speechSynthesis). No network calls.
 * Speaks in Spanish; silent no-op when unsupported or muted.
 */

let enabled = true;

export function setVoiceEnabled(value: boolean) {
  enabled = value;
  if (!value) cancelVoice();
}
export function isVoiceEnabled(): boolean {
  return enabled;
}

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, opts?: { interrupt?: boolean }) {
  if (!enabled || !supported()) return;
  const synth = window.speechSynthesis;
  if (opts?.interrupt) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = 1.05;
  u.pitch = 1;
  // Prefer a Spanish voice if available.
  const voices = synth.getVoices();
  const es = voices.find((v) => v.lang?.toLowerCase().startsWith("es"));
  if (es) u.voice = es;
  synth.speak(u);
}

export function cancelVoice() {
  if (supported()) window.speechSynthesis.cancel();
}
