"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { playCue } from "@/lib/audio/feedback";

/** Countdown rest timer between sets. Timestamp-driven; beeps at 0. */
export function RestTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = React.useState(seconds);
  const [running, setRunning] = React.useState(false);
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!running) return;
    const deadline = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        playCue("blockEnd");
        setRunning(false);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    firedRef.current = false;
    setRemaining(seconds);
    setRunning(true);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-telemetry text-2xl font-bold tabular-nums">
        {remaining}s
      </span>
      <Button
        variant={running ? "secondary" : "primary"}
        className="min-h-0 h-10 flex-1 text-sm"
        onClick={running ? () => setRunning(false) : start}
      >
        {running ? "Pausar descanso" : "Iniciar descanso"}
      </Button>
    </div>
  );
}
