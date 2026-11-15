/**
 * Stable contract for the shot analyzer. The UI depends only on this
 * interface (Req. 6.6), so the pose engine can be swapped without UI changes.
 */

export interface ShotAnalysisResult {
  /** Elbow angle at release, degrees. */
  elbowAngle: number;
  /** Knee flexion at the loading dip, degrees. */
  kneeFlexion: number;
  /** Release moment, ms from the start of the gesture. */
  releaseMs: number;
  /** Detection confidence, 0..1. Below 0.5 is considered unreliable (Req. 6.4). */
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
  /** Release underlying resources. */
  dispose?(): void;
}

export const CONFIDENCE_THRESHOLD = 0.5;
