import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Animated loading placeholder with a shimmer sweep.
 * Honors prefers-reduced-motion via the global CSS rule.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-border/60 relative overflow-hidden rounded-lg",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        "after:animate-[hm-shimmer_1.6s_infinite]",
        className,
      )}
      style={{ backgroundSize: "200% 100%" }}
      {...props}
    />
  );
}

/** Shot-chart skeleton: a court-sized block with zone hints. */
export function ShotChartSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[500/470] w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/** List skeleton for workouts / stats rows. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Stat cards skeleton (streaks / totals). */
export function StatsSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-20 flex-1 rounded-2xl" />
      <Skeleton className="h-20 flex-1 rounded-2xl" />
    </div>
  );
}
