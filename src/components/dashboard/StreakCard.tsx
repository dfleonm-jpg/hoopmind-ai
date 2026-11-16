import { Card } from "@/components/ui/card";

export function StreakCard({
  current,
  best,
}: {
  current: number;
  best: number;
}) {
  return (
    <Card variant="glass" className="flex items-center justify-around gap-4">
      <Stat label="Racha actual" value={current} suffix="días" fire={current > 0} />
      <div className="bg-border h-10 w-px" />
      <Stat label="Mejor racha" value={best} suffix="días" />
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix,
  fire,
}: {
  label: string;
  value: number;
  suffix: string;
  fire?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-accent text-glow-accent flex items-center gap-1 text-3xl font-black tabular-nums">
        {fire ? <span className="text-xl">🔥</span> : null}
        {value}
      </span>
      <span className="text-fg-muted text-xs">
        {label} · {suffix}
      </span>
    </div>
  );
}
