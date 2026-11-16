"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "hm-install-dismissed";

/** Custom PWA install banner using beforeinstallprompt (Android/desktop). */
export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setShow(false);
    setDeferred(null);
  }

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="pb-safe fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(var(--size-bottomnav)+12px)]"
        >
          <div className="glass glow-accent flex w-full max-w-md items-center gap-3 rounded-2xl p-3">
            <span className="from-accent-hover to-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-black text-on-accent">
              H
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-fg text-sm font-semibold">Instala HoopMind</p>
              <p className="text-fg-muted text-xs">
                Acceso directo, pantalla completa y uso offline.
              </p>
            </div>
            <Button className="min-h-0 h-10 shrink-0 px-4 text-sm" onClick={install}>
              Instalar
            </Button>
            <button
              onClick={dismiss}
              aria-label="Descartar"
              className="text-fg-muted shrink-0 px-1 text-lg"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
