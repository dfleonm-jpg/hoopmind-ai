"use client";

import * as React from "react";
import { initAutoFlush } from "@/lib/offline/sync-queue";

/** Registers the service worker and starts the offline sync auto-flush. */
export function PwaBootstrap() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => undefined);
    }
    const cleanup = initAutoFlush();
    return cleanup;
  }, []);

  return null;
}
