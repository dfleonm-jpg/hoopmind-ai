"use client";

import type {
  PoseEngine,
  PoseKeyframe,
  ShotAnalysisResult,
} from "@/lib/pose/types";

// Landmark indices (MediaPipe Pose, 33 points).
const L = {
  rShoulder: 12,
  rElbow: 14,
  rWrist: 16,
  rHip: 24,
  rKnee: 26,
  rAnkle: 28,
  lShoulder: 11,
  lElbow: 13,
  lWrist: 15,
  lHip: 23,
  lKnee: 25,
  lAnkle: 27,
} as const;

interface LM {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** Angle at point b (in degrees) formed by a-b-c. */
function angle(a: LM, b: LM, c: LM): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAb = Math.hypot(abx, aby);
  const magCb = Math.hypot(cbx, cby);
  if (magAb === 0 || magCb === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magAb * magCb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Client-only pose engine backed by MediaPipe Tasks Vision.
 * Loaded via dynamic import so it never runs during SSR (Req. 6.2, 6.5).
 */
export class MediaPipePoseEngine implements PoseEngine {
  private landmarker: unknown = null;

  private async ensureLandmarker() {
    if (this.landmarker) return this.landmarker;
    // Dynamic import keeps the heavy WASM bundle out of the initial payload.
    const vision = await import("@mediapipe/tasks-vision");
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
    );
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    return this.landmarker;
  }

  async analyzeShot(
    input: Blob | HTMLVideoElement,
  ): Promise<ShotAnalysisResult> {
    const landmarker = (await this.ensureLandmarker()) as {
      detectForVideo: (
        v: HTMLVideoElement,
        ts: number,
      ) => { landmarks: LM[][]; worldLandmarks?: LM[][] };
      close?: () => void;
    };

    const video = await toVideoElement(input);

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      return { elbowAngle: 0, kneeFlexion: 0, releaseMs: 0, confidence: 0 };
    }

    const FRAMES = 24;
    const samples: {
      tMs: number;
      elbow: number;
      knee: number;
      wristY: number;
      conf: number;
      keyframe: PoseKeyframe;
    }[] = [];

    for (let i = 0; i < FRAMES; i++) {
      const tSec = (duration * i) / (FRAMES - 1);
      await seek(video, tSec);
      const res = landmarker.detectForVideo(video, tSec * 1000);
      const lm = res.landmarks?.[0];
      if (!lm || lm.length < 29) continue;

      // Pick the side with higher wrist visibility as the shooting arm.
      const rVis =
        (lm[L.rWrist]?.visibility ?? 0) + (lm[L.rElbow]?.visibility ?? 0);
      const lVis =
        (lm[L.lWrist]?.visibility ?? 0) + (lm[L.lElbow]?.visibility ?? 0);
      const right = rVis >= lVis;

      const sh = lm[right ? L.rShoulder : L.lShoulder];
      const el = lm[right ? L.rElbow : L.lElbow];
      const wr = lm[right ? L.rWrist : L.lWrist];
      const hip = lm[right ? L.rHip : L.lHip];
      const kn = lm[right ? L.rKnee : L.lKnee];
      const an = lm[right ? L.rAnkle : L.lAnkle];
      if (!sh || !el || !wr || !hip || !kn || !an) continue;

      const vis = [sh, el, wr, hip, kn, an].map((p) => p.visibility ?? 0.6);
      const conf = vis.reduce((s, v) => s + v, 0) / vis.length;

      samples.push({
        tMs: tSec * 1000,
        elbow: angle(sh, el, wr),
        knee: angle(hip, kn, an),
        wristY: wr.y, // normalized; smaller = higher in frame
        conf,
        keyframe: {
          shoulder: { x: sh.x, y: sh.y },
          elbow: { x: el.x, y: el.y },
          wrist: { x: wr.x, y: wr.y },
          hip: { x: hip.x, y: hip.y },
          knee: { x: kn.x, y: kn.y },
          ankle: { x: an.x, y: an.y },
        },
      });
    }

    if (samples.length === 0) {
      return { elbowAngle: 0, kneeFlexion: 0, releaseMs: 0, confidence: 0 };
    }

    // Release ≈ frame where the wrist is highest (minimum y).
    let releaseIdx = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i]!.wristY < samples[releaseIdx]!.wristY) releaseIdx = i;
    }
    // Knee flexion is most informative at the loading dip (min knee angle).
    let dipIdx = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i]!.knee < samples[dipIdx]!.knee) dipIdx = i;
    }

    const release = samples[releaseIdx]!;
    const dip = samples[dipIdx]!;
    const confidence =
      samples.reduce((s, x) => s + x.conf, 0) / samples.length;

    return {
      elbowAngle: round1(release.elbow),
      kneeFlexion: round1(dip.knee),
      releaseMs: Math.round(release.tMs),
      confidence: Math.min(1, Math.max(0, round2(confidence))),
      keyframe: release.keyframe,
    };
  }

  dispose() {
    const l = this.landmarker as { close?: () => void } | null;
    l?.close?.();
    this.landmarker = null;
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function toVideoElement(
  input: Blob | HTMLVideoElement,
): Promise<HTMLVideoElement> {
  if (input instanceof HTMLVideoElement) return input;
  const url = URL.createObjectURL(input);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("No se pudo cargar el video."));
  });
  return video;
}

function seek(video: HTMLVideoElement, tSec: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = Math.min(tSec, Math.max(0, video.duration - 0.01));
  });
}

/** Factory used by the UI via dynamic import. */
export function createPoseEngine(): PoseEngine {
  return new MediaPipePoseEngine();
}
