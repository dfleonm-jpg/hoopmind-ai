import { Card } from "@/components/ui/card";

export function StreakCard({
  current,
  best,
}: {
  current: number;
  best: number;
}) {
  return (
    <Card className="flex items-center justify-around gap-4">
      <Stat label="Racha actual" value={current} suffix="días" />
      <div className="bg-border h-10 w-px" />
      <Stat label="Mejor racha" value={best} suffix="días" />
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-accent text-3xl font-bold tabular-nums">
        {value}
      </span>
      <span className="text-fg-muted text-xs">
        {label} · {suffix}
      </span>
    </div>
  );
}
