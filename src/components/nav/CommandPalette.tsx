"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Cmd {
  label: string;
  hint: string;
  href: string;
  keywords: string;
}

const COMMANDS: Cmd[] = [
  { label: "Entrenar ya", hint: "Inicio rápido", href: "/dashboard?train=1", keywords: "entrenar rutina quick start workout" },
  { label: "AI Coach", hint: "Chat", href: "/coach", keywords: "coach ia chat ayuda" },
  { label: "Gym", hint: "Body Transformation", href: "/gym", keywords: "gym fuerza musculo pesas" },
  { label: "Pliometría", hint: "Salto / explosividad", href: "/plyometrics", keywords: "pliometria salto vertical explosividad" },
  { label: "Pizarra táctica", hint: "Jugadas", href: "/plays", keywords: "pizarra jugadas plays tactica" },
  { label: "Lab de técnica", hint: "Tiro y bote", href: "/analyze", keywords: "analisis tiro bote dribble camara biomecanica" },
  { label: "Combine", hint: "Pruebas", href: "/combine", keywords: "combine pruebas test tiros" },
  { label: "Nutrición", hint: "Macros", href: "/nutrition", keywords: "nutricion comida macros calorias agua" },
  { label: "Recovery", hint: "Readiness", href: "/recovery", keywords: "recovery recuperacion sueno fatiga habitos" },
  { label: "Glow Up", hint: "Cuidado", href: "/glowup", keywords: "glow up skincare cabello postura" },
  { label: "Life OS", hint: "Agenda", href: "/life", keywords: "life agenda calendario planificar" },
  { label: "Perfil", hint: "Editar / antropometría", href: "/onboarding", keywords: "perfil editar antropometria medidas" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const openPalette = React.useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) {
            setQuery("");
            setActive(0);
          }
          return !o;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input once the dialog is open (effect only touches the DOM).
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.keywords.includes(q),
    );
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r.href);
    }
  }

  return (
    <>
      {/* Desktop trigger lives in the top-right via a floating button */}
      <button
        onClick={openPalette}
        aria-label="Buscar (Ctrl/Cmd + K)"
        className="glass text-fg-muted hover:text-fg fixed right-4 top-3 z-40 hidden items-center gap-2 rounded-full px-3 py-2 text-xs lg:flex"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx={11} cy={11} r={7} />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        Buscar
        <kbd className="bg-white/10 rounded px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar módulos"
          >
            <motion.div
              className="glass w-full max-w-lg overflow-hidden rounded-2xl"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Ir a… (gym, coach, nutrición, tiro…)"
                className="text-fg placeholder:text-fg-muted w-full bg-transparent px-4 py-4 text-base outline-none"
              />
              <ul className="max-h-[50vh] overflow-y-auto border-t border-white/8 p-2">
                {results.length === 0 ? (
                  <li className="text-fg-muted px-3 py-3 text-sm">Sin resultados.</li>
                ) : (
                  results.map((c, i) => (
                    <li key={c.href}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(c.href)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${
                          i === active ? "bg-accent/15" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="text-fg text-sm font-medium">{c.label}</span>
                        <span className="text-fg-muted text-xs">{c.hint}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
