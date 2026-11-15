const ITEMS = [
  { label: "Carrera", color: "var(--color-fg)", dash: undefined },
  { label: "Drible", color: "var(--color-accent)", dash: "wavy" },
  { label: "Pase / Tiro", color: "var(--color-success)", dash: "8 7" },
  { label: "Bloqueo", color: "var(--color-fg-muted)", dash: "2 6" },
] as const;

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Leyenda">
      {ITEMS.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <svg width={28} height={10} aria-hidden>
            {it.dash === "wavy" ? (
              <path
                d="M0 5 Q 3.5 0 7 5 T 14 5 T 21 5 T 28 5"
                fill="none"
                stroke={it.color}
                strokeWidth={2.5}
              />
            ) : (
              <line
                x1={0}
                y1={5}
                x2={28}
                y2={5}
                stroke={it.color}
                strokeWidth={2.5}
                strokeDasharray={it.dash}
                strokeLinecap="round"
              />
            )}
          </svg>
          <span className="text-fg-muted text-xs">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
