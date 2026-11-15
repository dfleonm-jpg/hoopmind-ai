/**
 * Stable contract for the shot analyzer. The UI depends only on this
 * interface (Req. 6.6), so the pose engine can be swapped without UI changes.
 */

/** Normalized (0..1) keypoint on the shooting side, for the skeleton overlay. */
export interface PoseKeypoint {
  x: number;
  y: number;
}

/** Shooting-side landmarks captured at the release frame (v2 Block 5). */
export interface PoseKeyframe {
  shoulder: PoseKeypoint;
  elbow: PoseKeypoint;
  wrist: PoseKeypoint;
  hip: PoseKeypoint;
  knee: PoseKeypoint;
  ankle: PoseKeypoint;
}

export interface ShotAnalysisResult {
  /** Elbow angle at release, degrees. */
  elbowAngle: number;
  /** Knee flexion at the loading dip, degrees. */
  kneeFlexion: number;
  /** Release moment, ms from the start of the gesture. */
  releaseMs: number;
  /** Detection confidence, 0..1. Below 0.5 is considered unreliable (Req. 6.4). */
  confidence: number;
  /** Shooting-side landmarks at the release frame, for the skeleton overlay. */
  keyframe?: PoseKeyframe;
}

/** Optimal ranges for coloring the skeleton overlay (green = ok, orange = adjust). */
export const OPTIMAL_ELBOW = { min: 80, max: 100 };
export const OPTIMAL_KNEE = { min: 100, max: 130 };

/** Result of the ball-handling / dribble analysis (v5). */
export interface DribbleAnalysisResult {
  /** Estimated dribbles per second (ball-hand reps). */
  tempo: number;
  /** Dribble height estimate: 0 (muy bajo/control) .. 1 (alto). */
  heightIndex: number;
  /** How low the stance is while handling, degrees of knee flexion (lower = better base). */
  stanceKnee: number;
  /** Lateral hand travel range (crossover amplitude), 0..1 normalized. */
  crossoverRange: number;
  /** Head/eyes-up proxy: how stable the head height is (1 = steady, eyes up). */
  headStability: number;
  /** Detection confidence 0..1. */
  confidence: number;
}

export interface PoseEngine {
  /**
   * Analyze a short shot clip entirely on the client.
   * Accepts a video Blob (uploaded/recorded) or an <video> element.
   */
  analyzeShot(
    video: Blob | HTMLVideoElement,
  ): Promise<ShotAnalysisResult>;
  /**
   * Analyze a short ball-handling clip (dribble tempo, stance, crossover,
   * eyes-up stability). Entirely client-side (v5).
   */
  analyzeDribble(
    video: Blob | HTMLVideoElement,
  ): Promise<DribbleAnalysisResult>;
  /** Release underlying resources. */
  dispose?(): void;
}

export const CONFIDENCE_THRESHOLD = 0.5;
