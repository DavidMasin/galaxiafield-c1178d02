import { useMatchStore, PERIOD_LABELS } from "@/store/matchStore";
import { cn } from "@/lib/utils";

export default function MatchTimer() {
  const period = useMatchStore((s) => s.period);
  const timeRemaining = useMatchStore((s) => s.timeRemaining);
  const paused = useMatchStore((s) => s.paused);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const periodColor = (() => {
    if (period === "auto" || period === "auto_grace") return "text-frc-yellow";
    if (period === "transition") return "text-primary";
    if (period.startsWith("shift")) return "text-frc-green";
    if (period === "endgame" || period === "teleop_grace") return "text-frc-orange";
    if (period === "finished") return "text-purple-400";
    return "text-muted-foreground";
  })();

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={cn("font-display text-5xl font-extrabold tracking-wider tabular-nums", periodColor)}>
        {period === "disabled" ? "--:--" : timeStr}
      </div>
      <div className={cn("font-display text-sm font-bold uppercase tracking-[0.3em]", periodColor)}>
        {PERIOD_LABELS[period]}
      </div>
      {paused && (
        <div className="font-mono text-xs text-frc-orange animate-pulse tracking-widest">
          PAUSED
        </div>
      )}
    </div>
  );
}
