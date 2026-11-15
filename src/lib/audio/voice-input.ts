"use client";

/**
 * Optional hands-free shot logging via the Web Speech API SpeechRecognition.
 * Recognizes "encestado" / "fallado" (and common variants) in Spanish.
 * Degrades to a no-op (returns null) when unsupported.
 */

type ShotWord = "made" | "miss";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceInputSupported(): boolean {
  return getRecognitionCtor() !== null;
}

function classify(transcript: string): ShotWord | null {
  const t = transcript.toLowerCase();
  if (/(encest|anot|dentro|metid|canast)/.test(t)) return "made";
  if (/(fall|fuera|erro|no entr)/.test(t)) return "miss";
  return null;
}

/**
 * Starts continuous recognition, calling `onShot` on each recognized word.
 * Returns a stop() function, or null if unsupported.
 */
export function startVoiceShotLogging(
  onShot: (word: ShotWord) => void,
): (() => void) | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.continuous = true;
  rec.interimResults = false;
  let stopped = false;

  rec.onresult = (e) => {
    const results = e.results;
    const last = results[results.length - 1];
    const transcript = last?.[0]?.transcript ?? "";
    const word = classify(transcript);
    if (word) onShot(word);
  };
  // Auto-restart on transient end (keeps listening during a block).
  rec.onend = () => {
    if (!stopped) {
      try {
        rec.start();
      } catch {
        /* ignore */
      }
    }
  };
  rec.onerror = () => {
    /* ignore transient errors; onend will restart */
  };

  try {
    rec.start();
  } catch {
    return null;
  }

  return () => {
    stopped = true;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}
