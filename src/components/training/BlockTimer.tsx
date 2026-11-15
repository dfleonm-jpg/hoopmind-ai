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
 *
 * The parent remounts this component (via `key`) to reset for a new block,
 * so there is no reset-in-effect; initial state comes straight from props.
 */
export function BlockTimer({
  durationS,
  running,
  onComplete,
}: {
  durationS: number;
  running: boolean;
  onComplete: () => void;
}) {
  const [remainingS, setRemainingS] = React.useState(durationS);
  const remainingRef = React.useRef(durationS);
  const firedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);

  // Keep the latest callback without re-running the interval effect.
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    if (!running) return;

    const deadline = Date.now() + remainingRef.current * 1000;

    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      remainingRef.current = left;
      setRemainingS(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [running]);

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
