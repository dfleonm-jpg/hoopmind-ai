"use client";

import * as React from "react";

function fmt(totalS: number): string {
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Countdown driven by real timestamps so it stays accurate across screen
 * lock / backgrounding (Req. 5.7): remaining = deadline - Date.now().
 */
export function BlockTimer({
  durationS,
  running,
  onComplete,
  resetKey,
}: {
  durationS: number;
  running: boolean;
  onComplete: () => void;
  /** change this to restart the timer (e.g. new block). */
  resetKey: string | number;
}) {
  const [remainingS, setRemainingS] = React.useState(durationS);
  const deadlineRef = React.useRef<number | null>(null);
  const firedRef = React.useRef(false);

  // Reset on new block.
  React.useEffect(() => {
    setRemainingS(durationS);
    deadlineRef.current = null;
    firedRef.current = false;
  }, [resetKey, durationS]);

  React.useEffect(() => {
    if (!running) {
      // Pausing: freeze remaining, drop the deadline.
      deadlineRef.current = null;
      return;
    }
    // (Re)start: compute an absolute deadline from the frozen remaining.
    deadlineRef.current = Date.now() + remainingS * 1000;

    const tick = () => {
      if (deadlineRef.current == null) return;
      const left = Math.max(
        0,
        Math.round((deadlineRef.current - Date.now()) / 1000),
      );
      setRemainingS(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    // Recompute immediately when returning to the tab.
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resetKey]);

  const pct = durationS > 0 ? (remainingS / durationS) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-fg text-center text-5xl font-bold tabular-nums"
        role="timer"
        aria-live="off"
      >
        {fmt(remainingS)}
      </div>
      <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent h-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
