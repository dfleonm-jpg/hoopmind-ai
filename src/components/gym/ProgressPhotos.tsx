"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

type Pose = "FRONT" | "SIDE" | "BACK";
const BUCKET = "progress-photos";

const POSES: { v: Pose; l: string }[] = [
  { v: "FRONT", l: "Frente" },
  { v: "SIDE", l: "Perfil" },
  { v: "BACK", l: "Espalda" },
];

interface PhotoRow {
  id: string;
  pose: Pose;
  takenAt: string;
  url: string | null;
}

export function ProgressPhotos() {
  const { toast } = useToast();
  const [consented, setConsented] = React.useState(false);
  const [showConsent, setShowConsent] = React.useState(false);
  const [pose, setPose] = React.useState<Pose>("FRONT");
  const [photos, setPhotos] = React.useState<PhotoRow[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [reload, setReload] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/progress-photos");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { photos: PhotoRow[] };
          setPhotos(data.photos);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  function requestUpload() {
    if (!consented) {
      setShowConsent(true);
      return;
    }
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Selecciona una imagen.", "error");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        toast("Sesión expirada.", "error");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${pose.toLowerCase()}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        toast(
          "No se pudo subir. ¿Está creado el bucket privado 'progress-photos' con sus políticas?",
          "error",
          6000,
        );
        return;
      }
      const res = await fetch("/api/progress-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pose, storagePath: path }),
      });
      if (!res.ok) {
        toast("Se subió el archivo pero no se registró.", "error");
        return;
      }
      toast("Foto de progreso guardada en privado.", "success");
      setReload((k) => k + 1);
    } catch {
      toast("Error al subir la foto.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/progress-photos/${id}`, { method: "DELETE" }).catch(() => null);
    setReload((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="glass" className="flex flex-col gap-2">
        <CardTitle>Fotos de progreso</CardTitle>
        <CardDescription>
          Privadas y cifradas en tu carpeta personal. Solo tú puedes verlas; se
          sirven con enlaces temporales. Puedes borrarlas cuando quieras.
        </CardDescription>
        <div className="flex gap-1.5">
          {POSES.map((p) => (
            <Button
              key={p.v}
              variant={pose === p.v ? "primary" : "secondary"}
              className="flex-1"
              onClick={() => setPose(p.v)}
            >
              {p.l}
            </Button>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFile}
        />
        <Button onClick={requestUpload} disabled={uploading}>
          {uploading ? "Subiendo…" : "Subir foto privada"}
        </Button>
      </Card>

      {/* Gallery */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              {p.url ? (
                <Image
                  src={p.url}
                  alt={`Progreso ${p.pose}`}
                  width={120}
                  height={160}
                  unoptimized
                  className="aspect-[3/4] w-full rounded-lg object-cover"
                />
              ) : (
                <div className="bg-card aspect-[3/4] w-full rounded-lg" />
              )}
              <button
                onClick={() => remove(p.id)}
                aria-label="Eliminar foto"
                className="bg-bg/80 text-danger absolute right-1 top-1 rounded-full px-1.5 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Consent modal */}
      {showConsent ? (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-bg border-border w-full max-w-sm rounded-2xl border p-5">
            <h2 className="text-fg text-lg font-bold">Consentimiento</h2>
            <p className="text-fg-muted mt-2 text-sm">
              Tus fotos se almacenan de forma privada en tu carpeta personal
              (bucket privado), accesibles solo por ti mediante enlaces
              temporales. No se comparten ni se usan para ningún análisis sin tu
              permiso. Puedes eliminarlas en cualquier momento.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowConsent(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setConsented(true);
                  setShowConsent(false);
                  setTimeout(() => fileRef.current?.click(), 50);
                }}
              >
                Acepto y subir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
