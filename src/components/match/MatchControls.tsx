import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { useMatchStore } from "@/store/matchStore";
import { usePiWs } from "@/ws/PiWsContext";

export default function MatchControls() {
  const { send } = usePiWs();

  const period = useMatchStore((s) => s.period);
  const paused = useMatchStore((s) => s.paused);
  const connection = useMatchStore((s) => s.connectionStatus);

  const isRunning = period !== "disabled" && period !== "finished";
  const canStart = period === "disabled" || period === "finished";
  const canPause = isRunning && !paused;
  const canResume = isRunning && paused;

  return (
    <div className="flex flex-col gap-3">
      {/* Debug row so you can SEE if normal page is connected */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
        <div className="font-mono text-xs text-muted-foreground">
          WS:{" "}
          <span
            className={
              connection === "connected"
                ? "text-frc-green"
                : connection === "reconnecting"
                ? "text-frc-orange"
                : "text-destructive"
            }
          >
            {connection}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => send({ type: "ping", ts: Date.now() })}
          className="font-mono text-xs"
        >
          Send Ping
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {canStart && (
          <Button
            onClick={() => send({ type: "match_start" })}
            className="gap-2 bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
            size="lg"
          >
            <Play size={18} /> Start Match
          </Button>
        )}

        {canPause && (
          <Button
            onClick={() => send({ type: "match_pause" })}
            className="gap-2 bg-frc-orange px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-orange/80"
            size="lg"
          >
            <Pause size={18} /> Pause
          </Button>
        )}

        {canResume && (
          <Button
            onClick={() => send({ type: "match_resume" })}
            className="gap-2 bg-frc-green px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
            size="lg"
          >
            <Play size={18} /> Resume
          </Button>
        )}

        {isRunning && (
          <Button
            onClick={() => send({ type: "match_stop" })}
            variant="secondary"
            className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
            size="lg"
          >
            <Square size={18} /> Stop
          </Button>
        )}

        <Button
          onClick={() => send({ type: "reset_count" })}
          variant="secondary"
          className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
          size="lg"
        >
          <RotateCcw size={18} /> Reset Count
        </Button>
      </div>
    </div>
  );
}
