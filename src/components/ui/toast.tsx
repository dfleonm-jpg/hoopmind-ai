"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type ToastKind = "info" | "success" | "error";

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind, durationMs?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // No-op fallback so components don't crash outside a provider.
    return { toast: () => undefined };
  }
  return ctx;
}

const KIND_STYLES: Record<ToastKind, string> = {
  info: "border-white/10",
  success: "border-success/50",
  error: "border-danger/50",
};

const KIND_DOT: Record<ToastKind, string> = {
  info: "bg-fg-muted",
  success: "bg-success",
  error: "bg-danger",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    (message: string, kind: ToastKind = "info", durationMs = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, kind }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    [],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Non-intrusive stack above the bottom navigation */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(var(--size-bottomnav)+16px)]"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3",
                KIND_STYLES[t.kind],
              )}
              role={t.kind === "error" ? "alert" : "status"}
            >
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", KIND_DOT[t.kind])}
              />
              <p className="text-fg text-sm">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
