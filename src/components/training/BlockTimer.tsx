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
 *
 * v3: optional callbacks for the coach voice — mid-block cue and the final
 * 5-second countdown.
 */
export function BlockTimer({
  durationS,
  running,
  onComplete,
  onHalf,
  onCountdown,
}: {
  durationS: number;
  running: boolean;
  onComplete: () => void;
  onHalf?: () => void;
  onCountdown?: (secondsLeft: number) => void;
}) {
  const [remainingS, setRemainingS] = React.useState(durationS);
  const remainingRef = React.useRef(durationS);
  const firedRef = React.useRef(false);
  const halfFiredRef = React.useRef(false);
  const lastCountRef = React.useRef<number | null>(null);
  const onCompleteRef = React.useRef(onComplete);
  const onHalfRef = React.useRef(onHalf);
  const onCountdownRef = React.useRef(onCountdown);

  // Keep latest callbacks without re-running the interval effect.
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
    onHalfRef.current = onHalf;
    onCountdownRef.current = onCountdown;
  }, [onComplete, onHalf, onCountdown]);

  React.useEffect(() => {
    if (!running) return;

    const deadline = Date.now() + remainingRef.current * 1000;

    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      remainingRef.current = left;
      setRemainingS(left);

      // Mid-block cue (once).
      if (
        !halfFiredRef.current &&
        durationS > 0 &&
        left <= Math.floor(durationS / 2) &&
        left > 5
      ) {
        halfFiredRef.current = true;
        onHalfRef.current?.();
      }

      // Final 5-second countdown (once per second).
      if (left <= 5 && left >= 1 && lastCountRef.current !== left) {
        lastCountRef.current = left;
        onCountdownRef.current?.(left);
      }

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
  }, [running, durationS]);

  const pct = durationS > 0 ? (remainingS / durationS) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-fg text-glow-accent text-center text-6xl font-black tabular-nums"
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
