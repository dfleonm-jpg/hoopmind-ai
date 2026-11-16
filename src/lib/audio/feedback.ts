"use client";

/**
 * Lightweight audio feedback via the Web Audio API — no external .mp3 files.
 * Short synthesized tones for shot made / attempted / block end, with mute.
 */

type Cue = "made" | "attempt" | "blockEnd" | "shotClockWarn" | "buzzer";

let ctx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function beep(freq: number, durationMs: number, type: OscillatorType = "sine") {
  const audio = getContext();
  if (!audio || muted) return;
  // Resume if the context was suspended by autoplay policy.
  if (audio.state === "suspended") void audio.resume();

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const now = audio.currentTime;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function setMuted(value: boolean) {
  muted = value;
}
export function isMuted(): boolean {
  return muted;
}
export function toggleMuted(): boolean {
  muted = !muted;
  return muted;
}

/** Should be called from a user gesture to unlock audio on mobile. */
export function unlockAudio() {
  const audio = getContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function playCue(cue: Cue) {
  switch (cue) {
    case "made":
      // Rising two-note confirmation.
      beep(660, 90, "triangle");
      setTimeout(() => beep(990, 120, "triangle"), 90);
      break;
    case "attempt":
      beep(320, 70, "sine");
      break;
    case "blockEnd":
      // Three short alerts to signal end of a timed block.
      beep(520, 140, "square");
      setTimeout(() => beep(520, 140, "square"), 200);
      setTimeout(() => beep(700, 220, "square"), 400);
      break;
    case "shotClockWarn":
      // Single short high beep for the final shot-clock seconds.
      beep(880, 110, "square");
      break;
    case "buzzer":
      // Synthesized buzzer: low sustained tone (shot-clock violation).
      buzzer();
      break;
  }
}

/** Long low buzzer for shot-clock expiry. */
function buzzer() {
  const audio = getContext();
  if (!audio || muted) return;
  if (audio.state === "suspended") void audio.resume();

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 180;

  const now = audio.currentTime;
  const dur = 1.1;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gain.gain.setValueAtTime(0.35, now + dur - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
