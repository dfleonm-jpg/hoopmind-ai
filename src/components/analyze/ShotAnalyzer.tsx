"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SkeletonOverlay } from "@/components/analyze/SkeletonOverlay";
import {
  CONFIDENCE_THRESHOLD,
  type PoseEngine,
  type ShotAnalysisResult,
} from "@/lib/pose/types";

type Status = "idle" | "recording" | "analyzing" | "done" | "error";

const MAX_RECORD_MS = 10_000;

export function ShotAnalyzer({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [result, setResult] = React.useState<ShotAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const engineRef = React.useRef<PoseEngine | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const previewRef = React.useRef<HTMLVideoElement | null>(null);

  const canRecord =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    "MediaRecorder" in window;

  React.useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      engineRef.current?.dispose?.();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  async function getEngine(): Promise<PoseEngine> {
    if (engineRef.current) return engineRef.current;
    // Dynamic import: engine (and its WASM) never loads during SSR.
    const { createPoseEngine } = await import(
      "@/lib/pose/mediapipe-engine"
    );
    engineRef.current = createPoseEngine();
    return engineRef.current;
  }

  async function analyzeBlob(blob: Blob) {
    setStatus("analyzing");
    setError(null);
    setSaved(false);
    try {
      const engine = await getEngine();
      const res = await engine.analyzeShot(blob);
      setResult(res);
      setStatus("done");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo analizar el video. Inténtalo de nuevo.",
      );
      setStatus("error");
    }
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    void analyzeBlob(file);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        void analyzeBlob(blob);
      };
      recorder.start();
      setStatus("recording");
      // Enforce the ≤10s limit (Req. 6.1).
      setTimeout(() => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }, MAX_RECORD_MS);
    } catch {
      setError("No se pudo acceder a la cámara. Puedes subir un video.");
      setStatus("error");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  async function saveMetrics() {
    if (!result || !sessionId) return;
    // Persist metrics (numbers only, never the video) against the session.
    try {
      const res = await fetch(`/api/sessions/${sessionId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elbowAngle: result.elbowAngle,
          kneeFlexion: result.kneeFlexion,
          releaseMs: result.releaseMs,
          confidence: result.confidence,
        }),
      });
      if (res.ok) setSaved(true);
      else setError("No se pudieron guardar las métricas.");
    } catch {
      setError("Error de red al guardar las métricas.");
    }
  }

  const lowConfidence =
    result != null && result.confidence < CONFIDENCE_THRESHOLD;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <CardTitle>Analiza tu tiro</CardTitle>
        <CardDescription>
          Graba un tiro libre o un triple (máx. 10 s) o sube un video. El
          análisis se ejecuta en tu dispositivo; el video no se sube a ningún
          servidor.
        </CardDescription>

        {/* Live preview while recording */}
        <video
          ref={previewRef}
          playsInline
          muted
          className={`w-full rounded-xl ${status === "recording" ? "block" : "hidden"}`}
        />

        {/* Recorded/uploaded playback with skeleton overlay at the release frame */}
        {videoUrl && status !== "recording" ? (
          <div className="relative w-full overflow-hidden rounded-xl">
            <video
              src={videoUrl}
              controls
              playsInline
              className="w-full rounded-xl"
            />
            {result?.keyframe && !lowConfidence ? (
              <SkeletonOverlay
                keyframe={result.keyframe}
                elbowAngle={result.elbowAngle}
                kneeAngle={result.kneeFlexion}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            ) : null}
          </div>
        ) : null}

        {result?.keyframe && !lowConfidence ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="text-fg-muted flex items-center gap-1.5">
              <span className="bg-success h-2.5 w-2.5 rounded-full" /> Rango
              óptimo
            </span>
            <span className="text-fg-muted flex items-center gap-1.5">
              <span className="bg-accent h-2.5 w-2.5 rounded-full" /> Ajustar
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {canRecord && status !== "recording" ? (
            <Button className="w-full" onClick={startRecording}>
              Grabar (10 s)
            </Button>
          ) : null}
          {status === "recording" ? (
            <Button className="w-full" variant="secondary" onClick={stopRecording}>
              Detener
            </Button>
          ) : null}

          <label className="w-full">
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={onUpload}
            />
            <span className="bg-card text-fg border-border hover:border-accent min-h-touch inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-4 font-semibold">
              Subir video
            </span>
          </label>
        </div>
      </Card>

      {status === "analyzing" ? (
        <Card>
          <p className="text-fg-muted text-sm">Analizando la mecánica…</p>
        </Card>
      ) : null}

      {status === "error" && error ? (
        <Card>
          <p
            role="alert"
            className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm"
          >
            {error}
          </p>
        </Card>
      ) : null}

      {result ? (
        <Card className="flex flex-col gap-3">
          <CardTitle>Resultado</CardTitle>

          {lowConfidence ? (
            <p
              role="alert"
              className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm"
            >
              Confianza baja ({Math.round(result.confidence * 100)}%). El
              análisis no es fiable: regraba con el cuerpo completo en cuadro y
              buena iluminación.
            </p>
          ) : null}

          <ul className="flex flex-col gap-2">
            <Metric label="Ángulo de codo" value={`${result.elbowAngle}°`} />
            <Metric
              label="Flexión de rodillas"
              value={`${result.kneeFlexion}°`}
            />
            <Metric label="Liberación" value={`${result.releaseMs} ms`} />
            <Metric
              label="Confianza"
              value={`${Math.round(result.confidence * 100)}%`}
            />
          </ul>

          {!lowConfidence && sessionId ? (
            <Button
              variant="secondary"
              disabled={saved}
              onClick={saveMetrics}
            >
              {saved ? "Métricas guardadas" : "Guardar métricas"}
            </Button>
          ) : !lowConfidence ? (
            <p className="text-fg-muted text-xs">
              Abre el analizador desde una sesión para guardar estas métricas.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <li className="border-border flex items-center justify-between border-b pb-2 last:border-0">
      <span className="text-fg-muted text-sm">{label}</span>
      <span className="text-fg text-lg font-semibold tabular-nums">
        {value}
      </span>
    </li>
  );
}
