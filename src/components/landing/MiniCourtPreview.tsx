"use client";

import { TacticBoard } from "@/components/tactic-board/TacticBoard";
import { getDrill } from "@/lib/drills/presets";

/** Auto-looping, non-interactive tactic-board preview for the landing hero. */
export function MiniCourtPreview() {
  return <TacticBoard drill={getDrill("pick_and_roll")} autoLoop />;
}
