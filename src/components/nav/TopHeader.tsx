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
    <header className="glass pt-safe sticky top-0 z-40 border-b border-white/10">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex min-w-0 flex-col">
          <span className="text-accent text-[11px] font-semibold tracking-widest uppercase">
            HoopMind AI
          </span>
          <span className="text-fg truncate text-lg font-bold tracking-tight">
            {title}
          </span>
          {subtitle ? (
            <span className="text-fg-muted truncate text-xs">{subtitle}</span>
          ) : null}
        </Link>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
