"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiIntake } from "@/components/coach/AiIntake";

/**
 * Entry point for the conversational AI intake on the coach page.
 * Shows a prompt card; expands into the survey when the user opts in.
 */
export function IntakeLauncher() {
  const [open, setOpen] = React.useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open ? (
        <motion.div
          key="intake"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <AiIntake onClose={() => setOpen(false)} />
        </motion.div>
      ) : (
        <motion.div
          key="launcher"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Card variant="glass" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-accent text-[11px] font-semibold tracking-widest uppercase">
                Coach IA
              </span>
              <CardTitle className="text-lg">
                Deja que el coach arme tu rutina
              </CardTitle>
              <CardDescription>
                Responde unas preguntas rápidas y la IA genera una sesión
                personalizada a tus objetivos, tiempo y estado físico de hoy.
              </CardDescription>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
              Empezar encuesta
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
