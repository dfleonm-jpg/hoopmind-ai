import * as React from "react";
import Link from "next/link";

/** Sticky glass header for app routes. `action` renders on the right. */
export function TopHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-white/8 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <span className="from-accent-hover to-accent glow-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-on-accent">
            H
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-accent text-[10px] font-semibold tracking-[0.2em] uppercase">
              HoopMind
            </span>
            <span className="text-fg truncate text-lg font-bold tracking-tight">
              {title}
            </span>
            {subtitle ? (
              <span className="text-fg-muted truncate text-xs">{subtitle}</span>
            ) : null}
          </span>
        </Link>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
