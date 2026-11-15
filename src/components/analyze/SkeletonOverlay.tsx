"use client";

import * as React from "react";
import {
  OPTIMAL_ELBOW,
  OPTIMAL_KNEE,
  type PoseKeyframe,
} from "@/lib/pose/types";

const GREEN = "#22c55e";
const ORANGE = "#ff5e1a";
const BONE = "#f5f6f7";

function inRange(v: number, r: { min: number; max: number }): boolean {
  return v >= r.min && v <= r.max;
}

/**
 * Draws the shooting-side skeleton over the analyzed video (v2 Block 5).
 * Keypoints are normalized (0..1); segments are colored by optimal range:
 * green = óptimo, naranja = ajustar.
 */
export function SkeletonOverlay({
  keyframe,
  elbowAngle,
  kneeAngle,
  className,
}: {
  keyframe: PoseKeyframe;
  elbowAngle: number;
  kneeAngle: number;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const p = (k: { x: number; y: number }): [number, number] => [
      k.x * W,
      k.y * H,
    ];

    const elbowColor = inRange(elbowAngle, OPTIMAL_ELBOW) ? GREEN : ORANGE;
    const kneeColor = inRange(kneeAngle, OPTIMAL_KNEE) ? GREEN : ORANGE;

    const seg = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      color: string,
    ) => {
      ctx.beginPath();
      ctx.moveTo(...p(a));
      ctx.lineTo(...p(b));
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    // Arm: shoulder→elbow→wrist (colored by elbow angle).
    seg(keyframe.shoulder, keyframe.elbow, elbowColor);
    seg(keyframe.elbow, keyframe.wrist, elbowColor);
    // Torso: shoulder→hip (neutral).
    seg(keyframe.shoulder, keyframe.hip, BONE);
    // Legs: hip→knee→ankle (colored by knee flexion).
    seg(keyframe.hip, keyframe.knee, kneeColor);
    seg(keyframe.knee, keyframe.ankle, kneeColor);

    // Joints.
    const joint = (k: { x: number; y: number }, color: string) => {
      const [x, y] = p(k);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };
    joint(keyframe.shoulder, BONE);
    joint(keyframe.elbow, elbowColor);
    joint(keyframe.wrist, elbowColor);
    joint(keyframe.hip, BONE);
    joint(keyframe.knee, kneeColor);
    joint(keyframe.ankle, kneeColor);
  }, [keyframe, elbowAngle, kneeAngle]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={640}
      className={className}
      aria-label="Esqueleto del tiro con zonas de ajuste"
    />
  );
}
