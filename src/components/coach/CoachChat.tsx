"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type Specialty =
  | "BASKETBALL"
  | "STRENGTH"
  | "NUTRITION"
  | "GLOWUP"
  | "RECOVERY"
  | "PERFORMANCE";

const SPECIALTIES: { v: Specialty; l: string }[] = [
  { v: "PERFORMANCE", l: "Analista" },
  { v: "BASKETBALL", l: "Baloncesto" },
  { v: "STRENGTH", l: "Fuerza" },
  { v: "NUTRITION", l: "Nutrición" },
  { v: "RECOVERY", l: "Recuperación" },
  { v: "GLOWUP", l: "Glow Up" },
];

interface Msg {
  role: "USER" | "ASSISTANT";
  content: string;
}

export function CoachChat() {
  const { toast } = useToast();
  const [specialty, setSpecialty] = React.useState<Specialty>("PERFORMANCE");
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function switchSpecialty(s: Specialty) {
    setSpecialty(s);
    setConversationId(null);
    setMessages([]);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    setSending(true);
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty, conversationId, message: text }),
      });
      const data = (await res.json().catch(() => null)) as {
        conversationId?: string;
        reply?: string;
        error?: { message?: string };
      } | null;
      if (!res.ok || !data?.reply) {
        toast(data?.error?.message ?? "El coach no respondió.", "error");
        return;
      }
      setConversationId(data.conversationId ?? conversationId);
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: data.reply! }]);
    } catch {
      toast("Error de red.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Specialty selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Especialidad del coach">
        {SPECIALTIES.map((s) => (
          <Button
            key={s.v}
            variant={specialty === s.v ? "primary" : "secondary"}
            className="min-h-0 h-10 shrink-0 px-3 text-sm"
            onClick={() => switchSpecialty(s.v)}
          >
            {s.l}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <Card variant="glass" className="flex min-h-[320px] flex-col gap-3">
        {messages.length === 0 ? (
          <div className="text-fg-muted flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm">
            <span className="text-3xl" aria-hidden>🧠</span>
            <p>
              Pregúntale a tu coach. Conoce tu perfil, gym, nutrición,
              recuperación y estadísticas reales.
            </p>
            <p className="text-xs">
              Ej.: &quot;Dormí 4 h y ayer entrené piernas fuerte, ¿qué hago hoy?&quot;
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "USER"
                  ? "from-accent-hover to-accent text-on-accent self-end bg-gradient-to-br shadow-[0_6px_20px_-8px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]"
                  : "glass text-fg self-start"
              }`}
            >
              {m.content}
            </motion.div>
          ))
        )}
        {sending ? (
          <div className="glass text-fg-muted self-start rounded-2xl px-3.5 py-3">
            <span className="flex gap-1.5" aria-label="Pensando">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="bg-accent h-2 w-2 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </Card>

      {/* Composer */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escribe tu mensaje…"
          className="bg-bg text-fg border-border min-h-touch flex-1 rounded-xl border px-3 text-base"
          aria-label="Mensaje al coach"
        />
        <Button onClick={send} disabled={sending || input.trim().length === 0}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
