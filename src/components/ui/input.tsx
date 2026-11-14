import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional accessible label rendered above the field. */
  label?: string;
  /** Validation / helper text; when `error` is true it is styled as an error. */
  hint?: string;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, hint, error, id, ...props }, ref) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-fg text-sm font-medium">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error || undefined}
          aria-describedby={hintId}
          className={cn(
            "bg-bg text-fg placeholder:text-fg-muted border rounded-xl px-3",
            "min-h-touch w-full text-base",
            "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
            error ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p
            id={hintId}
            className={cn("text-sm", error ? "text-danger" : "text-fg-muted")}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
