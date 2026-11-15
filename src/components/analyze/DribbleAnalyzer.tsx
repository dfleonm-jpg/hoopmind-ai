"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  CONFIDENCE_THRESHOLD,
  type PoseEngine,
  type DribbleAnalysisResult,
} from "@/lib/pose/types";

type Status = "idle" | "recording" | "analyzing" | "done" | "error";
const MAX_RECORD_MS = 10_000;

interface Metric {
  label: string;
  value: string;
  good: boolean;
  hint: string;
}

/** Build the coaching read-out from the dribble metrics (basketball-specific). */
function buildMetrics(r: DribbleAnalysisResult): { metrics: Metric[]; cue: string } {
  const metrics: Metric[] = [
    {
      label: "Tempo de bote",
      value: `${r.tempo.toFixed(1)} /s`,
      good: r.tempo >= 2,
      hint: r.tempo >= 2 ? "Ritmo explosivo y repetitivo." : "Busca botes más rápidos y constantes.",
    },
    {
      label: "Altura del bote",
      value: r.heightIndex <= 0.5 ? "Bajo (control)" : "Alto",
      good: r.heightIndex <= 0.5,
      hint: r.heightIndex <= 0.5 ? "Bote bajo = más protección." : "Baja el bote a la altura de la rodilla para protegerlo.",
    },
    {
      label: "Base / stance",
      value: `${Math.round(r.stanceKnee)}°`,
      good: r.stanceKnee <= 150,
      hint: r.stanceKnee <= 150 ? "Buena flexión, centro de gravedad bajo." : "Flexiona más las rodillas: base baja y lista para atacar.",
    },
    {
      label: "Amplitud de crossover",
      value: r.crossoverRange >= 0.4 ? "Amplia" : "Corta",
      good: r.crossoverRange >= 0.4,
      hint: r.crossoverRange >= 0.4 ? "Buen desplazamiento lateral del balón." : "Un crossover más amplio engaña mejor al defensor.",
    },
    {
      label: "Ojos arriba",
      value: `${Math.round(r.headStability * 100)}%`,
      good: r.headStability >= 0.7,
      hint: r.headStability >= 0.7 ? "Cabeza estable: lees la cancha." : "Mantén la cabeza alta y estable para leer al rival.",
    },
  ];
  const worst = metrics.find((m) => !m.good);
  return { metrics, cue: worst ? worst.hint : "Mecánica de bote sólida. ¡Sigue así!" };
}

export function DribbleAnalyzer() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [result, setResult] = React.useState<DribbleAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);

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
    const { createPoseEngine } = await import("@/lib/pose/mediapipe-engine");
    engineRef.current = createPoseEngine();
    return engineRef.current;
  }

  async function analyzeBlob(blob: Blob) {
    setStatus("analyzing");
    setError(null);
    try {
      const engine = await getEngine();
      const res = await engine.analyzeDribble(blob);
      setResult(res);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar el video.");
      setStatus("error");
    }
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
        setVideoUrl(URL.createObjectURL(blob));
        void analyzeBlob(blob);
      };
      recorder.start();
      setStatus("recording");
      setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, MAX_RECORD_MS);
    } catch {
      setError("No se pudo acceder a la cámara. Puedes subir un video.");
      setStatus("error");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  const lowConfidence = result != null && result.confidence < CONFIDENCE_THRESHOLD;
  const read = result && !lowConfidence ? buildMetrics(result) : null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <Card className="flex flex-col gap-3 lg:flex-1">
        <CardTitle>Analiza tu bote</CardTitle>
        <CardDescription>
          Graba 5–10 s driblando de frente a la cámara (crossover, entre piernas,
          cambios de ritmo). El análisis corre en tu dispositivo; el video no se sube.
        </CardDescription>

        <div
          className={`relative w-full overflow-hidden rounded-xl ${status === "recording" ? "block" : "hidden"}`}
        >
          <video ref={previewRef} playsInline muted className="w-full" />
        </div>

        {videoUrl && status !== "recording" ? (
          <video src={videoUrl} controls playsInline className="w-full rounded-xl" />
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
            <input type="file" accept="video/*" className="sr-only" onChange={onUpload} />
            <span className="bg-card/70 text-fg border border-white/10 hover:border-accent/60 min-h-touch inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 font-semibold">
              Subir video
            </span>
          </label>
        </div>

        {status === "analyzing" ? (
          <p className="text-fg-muted text-sm">Analizando tu manejo de balón…</p>
        ) : null}
        {status === "error" && error ? (
          <p role="alert" className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
      </Card>

      {result ? (
        <Card className="flex flex-col gap-3 lg:flex-1">
          <CardTitle>Lectura de ball handling</CardTitle>
          {lowConfidence ? (
            <p role="alert" className="border-danger/40 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm">
              Confianza baja ({Math.round(result.confidence * 100)}%). Regraba con el
              cuerpo completo en cuadro y buena luz.
            </p>
          ) : read ? (
            <>
              <ul className="flex flex-col gap-2.5">
                {read.metrics.map((m) => (
                  <li key={m.label} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted text-sm">{m.label}</span>
                      <span className={`text-sm font-bold tabular-nums ${m.good ? "text-success" : "text-accent"}`}>
                        {m.value} {m.good ? "✓" : "⚠"}
                      </span>
                    </div>
                    <span className="text-fg-muted text-[11px]">{m.hint}</span>
                  </li>
                ))}
              </ul>
              <div className="border-accent/40 bg-accent/10 rounded-xl border p-3">
                <p className="text-accent text-xs font-semibold tracking-widest uppercase">Foco inmediato</p>
                <p className="text-fg-muted mt-1 text-sm">{read.cue}</p>
              </div>
              <p className="text-fg-muted text-[11px]">
                Estimaciones por análisis de pose, no mediciones exactas. Para contacto,
                graba de frente y a cuerpo completo.
              </p>
            </>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
