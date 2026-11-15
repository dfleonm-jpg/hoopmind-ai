"use client";

import * as React from "react";
import { initAutoFlush, flushQueue } from "@/lib/offline/sync-queue";
import { useToast } from "@/components/ui/toast";

/** Registers the service worker, runs offline auto-flush and surfaces toasts. */
export function PwaBootstrap() {
  const { toast } = useToast();

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const cleanup = initAutoFlush();

    const onOffline = () => toast("Sin conexión. Guardaremos tu progreso.", "info");
    const onOnline = async () => {
      const flushed = await flushQueue();
      if (flushed > 0) {
        toast(`Sincronizado (${flushed} pendiente(s)).`, "success");
      }
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      cleanup();
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [toast]);

  return null;
}
