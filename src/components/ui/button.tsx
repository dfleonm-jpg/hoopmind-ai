import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "text-on-accent bg-gradient-to-b from-accent-hover to-accent shadow-[0_8px_28px_-10px_color-mix(in_srgb,var(--color-accent)_70%,transparent)] hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:shadow-none",
  secondary:
    "bg-card/70 text-fg border border-white/10 backdrop-blur-sm hover:border-accent/60 hover:bg-card disabled:opacity-50",
  ghost: "bg-transparent text-fg hover:bg-white/5 disabled:opacity-50",
};

// All sizes respect the >=48x48px on-court touch target (Req. 8.6).
const sizes: Record<Size, string> = {
  md: "min-h-touch min-w-touch px-4 text-base",
  lg: "min-h-14 px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
          "transition-all duration-150 select-none active:scale-[0.97]",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "disabled:cursor-not-allowed disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
