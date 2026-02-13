import { useMemo } from "react";
import { useMatchStore, PERIOD_LABELS } from "@/store/matchStore";
import { usePiWs } from "@/ws/PiWsContext";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Square, Zap } from "lucide-react";

export default function FullScreenMatch() {
  const { send } = usePiWs();

  const period = useMatchStore((s) => s.period);
  const paused = useMatchStore((s) => s.paused);
  const timeRemaining = useMatchStore((s) => s.timeRemaining);
  const globalBallCount = useMatchStore((s) => s.globalBallCount);
  const redHubStatus = useMatchStore((s) => s.redHubStatus);
  const blueHubStatus = useMatchStore((s) => s.blueHubStatus);
  const ledMode = useMatchStore((s) => s.ledMode);

  const isRunning = period !== "disabled" && period !== "finished";
  const canStart = period === "disabled";
  const canPause = isRunning && !paused;
  const canResume = isRunning && paused;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const periodColor = useMemo(() => {
    if (period === "auto" || period === "auto_grace") return "text-frc-yellow";
    if (period === "transition") return "text-primary";
    if (period.startsWith("shift")) return "text-frc-green";
    if (period === "endgame" || period === "teleop_grace") return "text-frc-orange";
    if (period === "finished") return "text-purple-400";
    return "text-muted-foreground";
  }, [period]);

  return (
    <div className={cn("flex h-screen w-screen flex-col bg-background p-6 select-none", ledMode.startsWith("pulse") && "animate-pulse-glow")}>
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-bold uppercase tracking-[0.3em] text-foreground">
          FRC HUB
        </div>
        <div className="font-mono text-sm text-muted-foreground">
          LED: {ledMode}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className={cn("font-display text-3xl font-bold uppercase tracking-[0.4em]", periodColor)}>
          {PERIOD_LABELS[period]}
        </div>

        <div className={cn("font-mono text-[10rem] font-bold tabular-nums leading-none", periodColor)}>
          {period === "disabled" ? "--:--" : timeStr}
        </div>

        <div className="flex gap-10">
          <HubBox label="RED" status={redHubStatus} />
          <HubBox label="BLUE" status={blueHubStatus} />
        </div>

        <div className="flex flex-col items-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            BALLS SCORED
          </div>
          <div className="font-display text-[6rem] font-extrabold leading-none text-foreground">
            {globalBallCount}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        {canStart && (
          <button
            onClick={() => send({ type: "match_start" })}
            className="rounded-sm bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-background hover:opacity-90"
          >
            <Play className="inline-block h-4 w-4 mr-2" />
            Start
          </button>
        )}

        {canPause && (
          <button
            onClick={() => send({ type: "match_pause" })}
            className="rounded-sm bg-frc-orange px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-background hover:opacity-90"
          >
            <Pause className="inline-block h-4 w-4 mr-2" />
            Pause
          </button>
        )}

        {canResume && (
          <button
            onClick={() => send({ type: "match_resume" })}
            className="rounded-sm bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-background hover:opacity-90"
          >
            <Play className="inline-block h-4 w-4 mr-2" />
            Resume
          </button>
        )}

        {isRunning && (
          <button
            onClick={() => send({ type: "match_stop" })}
            className="rounded-sm border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <Square className="inline-block h-4 w-4 mr-2" />
            Stop
          </button>
        )}

        <button
          onClick={() => send({ type: "reset_count" })}
          className="rounded-sm border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="inline-block h-4 w-4 mr-2" />
          Reset Count
        </button>

        <button
          onClick={() => send({ type: "force", mode: "force_active" })}
          className="rounded-sm border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Force Active
        </button>

        <button
          onClick={() => send({ type: "force", mode: null })}
          className="rounded-sm border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Force Off
        </button>

        <button
          onClick={() => send({ type: "motor", percent: 0 })}
          className="rounded-sm bg-destructive px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground hover:opacity-90"
        >
          <Zap className="inline-block h-4 w-4 mr-2" />
          E-STOP
        </button>
      </div>
    </div>
  );
}

function HubBox({ label, status }: { label: string; status: "active" | "inactive" | "warning" }) {
  const color =
    status === "active" ? "text-frc-green" : status === "warning" ? "text-frc-orange" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-display text-sm font-bold uppercase tracking-[0.3em] text-foreground">
        {label}
      </div>
      <div className={cn("font-mono text-xs uppercase tracking-widest", color)}>
        {status}
      </div>
    </div>
  );
}
