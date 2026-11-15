"use client";

import * as React from "react";
import type { Drill, Point } from "@/lib/drills/types";
import { EntityToken } from "./EntityToken";
import { MovePath } from "./MovePath";
import { endPoint } from "./path-utils";

/** Position of each entity at the START of `stepIndex` (end of previous moves). */
function positionsBefore(drill: Drill, stepIndex: number): Map<string, Point> {
  const pos = new Map<string, Point>();
  for (const e of drill.entities) pos.set(e.id, e.start);
  for (let i = 0; i < stepIndex; i++) {
    const step = drill.steps[i];
    if (!step) continue;
    for (const move of step.moves) {
      pos.set(move.entity, endPoint(move.path));
    }
  }
  return pos;
}

export function DrillLayer({
  drill,
  stepIndex,
  playing,
}: {
  drill: Drill;
  stepIndex: number;
  /** true → animate current step; false → show it statically (paused/reduced). */
  playing: boolean;
}) {
  const before = React.useMemo(
    () => positionsBefore(drill, stepIndex),
    [drill, stepIndex],
  );
  const step = drill.steps[stepIndex];
  const movingEntities = new Set(step?.moves.map((m) => m.entity) ?? []);

  // Entity → the move it performs this step (if any).
  const moveByEntity = new Map(step?.moves.map((m) => [m.entity, m]) ?? []);

  return (
    <g>
      {/* Trajectories for the current step */}
      {step?.moves.map((move, i) => (
        <MovePath key={`${stepIndex}-${i}`} move={move} animate={playing} />
      ))}

      {/* Tokens: animate movers, keep others at their current position */}
      {drill.entities.map((entity) => {
        const start = before.get(entity.id) ?? entity.start;
        const move = moveByEntity.get(entity.id);

        if (playing && move && movingEntities.has(entity.id)) {
          return (
            <EntityToken
              key={entity.id}
              entity={entity}
              at={start}
              animatePath={move.path}
              durationMs={move.durationMs}
            />
          );
        }

        // Static: if paused or already moved, show at end-of-step position.
        const at = move ? endPoint(move.path) : start;
        return <EntityToken key={entity.id} entity={entity} at={at} />;
      })}
    </g>
  );
}
