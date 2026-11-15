"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { playCue } from "@/lib/audio/feedback";

/**
 * Possession shot clock: 24s (5v5) / 12s (3x3). Giant countdown with warning
 * beeps in the last 3s and a synthesized buzzer at 0. Timestamp-driven so it
 * stays accurate across backgrounding.
 */
export function ShotClock({ muted }: { muted: boolean }) {
  const [limit, setLimit] = React.useState<24 | 12>(24);
  const [remaining, setRemaining] = React.useState(24);
  const [running, setRunning] = React.useState(false);
  const deadlineRef = React.useRef<number | null>(null);
  const lastWarnRef = React.useRef<number | null>(null);
  const mutedRef = React.useRef(muted);
  React.useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  React.useEffect(() => {
    if (!running) return;
    const deadline = Date.now() + remaining * 1000;
    deadlineRef.current = deadline;

    const tick = () => {
      const leftMs = Math.max(0, deadline - Date.now());
      const left = Math.ceil(leftMs / 1000);
      setRemaining(left);

      // Warning beeps at 3, 2, 1 (once each).
      if (left <= 3 && left >= 1 && lastWarnRef.current !== left) {
        lastWarnRef.current = left;
        if (!mutedRef.current) playCue("shotClockWarn");
      }
      if (leftMs <= 0) {
        setRunning(false);
        if (!mutedRef.current) playCue("buzzer");
      }
    };

    tick();
    const id = setInterval(tick, 100);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function reset(toLimit = limit) {
    setRunning(false);
    setRemaining(toLimit);
    lastWarnRef.current = null;
  }

  function selectLimit(l: 24 | 12) {
    setLimit(l);
    setRunning(false);
    setRemaining(l);
    lastWarnRef.current = null;
  }

  const danger = remaining <= 3 && remaining > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-xs font-semibold tracking-widest uppercase">
          Reloj de posesión
        </span>
        <div className="flex gap-1" role="group" aria-label="Límite de posesión">
          <Button
            variant={limit === 24 ? "primary" : "secondary"}
            className="min-h-0 h-9 px-3 text-xs"
            onClick={() => selectLimit(24)}
          >
            24s
          </Button>
          <Button
            variant={limit === 12 ? "primary" : "secondary"}
            className="min-h-0 h-9 px-3 text-xs"
            onClick={() => selectLimit(12)}
          >
            12s
          </Button>
        </div>
      </div>

      <div
        className={`text-center text-7xl font-extrabold tabular-nums ${
          danger ? "text-danger" : "text-telemetry"
        }`}
        role="timer"
        aria-live="off"
      >
        {remaining}
      </div>

      <div className="flex gap-2">
        {running ? (
          <Button variant="secondary" className="flex-1" onClick={() => setRunning(false)}>
            Pausar
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={() => {
              if (remaining <= 0) reset();
              setRunning(true);
            }}
          >
            {remaining <= 0 ? "Reiniciar" : "Iniciar posesión"}
          </Button>
        )}
        <Button variant="ghost" className="px-4" onClick={() => reset()}>
          Reset
        </Button>
      </div>
    </div>
  );
}
