import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Subtle glassmorphism surface for premium dark UI (v2). */
  variant?: "solid" | "glass";
}

export function Card({ className, variant = "solid", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        variant === "glass"
          ? "glass"
          : "bg-card/80 border border-white/8 shadow-[0_14px_36px_-28px_rgb(0_0_0/0.9)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-fg text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-fg-muted text-sm", className)} {...props} />
  );
}
