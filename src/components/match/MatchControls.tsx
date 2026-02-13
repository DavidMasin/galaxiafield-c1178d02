import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw, AlertTriangle } from "lucide-react";
import { useMatchStore } from "@/store/matchStore";
import { usePiWs } from "@/ws/PiWsContext";

export default function MatchControls() {
  const { send } = usePiWs();
  const period = useMatchStore((s) => s.period);
  const paused = useMatchStore((s) => s.paused);

  const isRunning = period !== "disabled" && period !== "finished";
  const canStart = period === "disabled";
  const canPause = isRunning && !paused;
  const canResume = isRunning && paused;

  return (
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

      <Button
        onClick={() => send({ type: "field_safe", mode: "green" })}
        variant="secondary"
        className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
        size="lg"
      >
        FIELD SAFE
      </Button>

      <Button
        onClick={() => send({ type: "field_safe", mode: "purple" })}
        variant="secondary"
        className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
        size="lg"
      >
        POST MATCH
      </Button>

      <Button
        onClick={() => send({ type: "force", mode: "force_active" })}
        variant="secondary"
        className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
        size="lg"
      >
        Force Active
      </Button>

      <Button
        onClick={() => send({ type: "force", mode: "force_inactive" })}
        variant="secondary"
        className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
        size="lg"
      >
        Force Inactive
      </Button>

      <Button
        onClick={() => send({ type: "force", mode: null })}
        variant="secondary"
        className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
        size="lg"
      >
        Force Off
      </Button>

      <Button
        onClick={() => send({ type: "motor", percent: 0 })}
        className="gap-2 border-2 border-destructive bg-destructive px-6 font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground hover:bg-destructive/80"
        size="lg"
      >
        <AlertTriangle size={18} /> E-STOP (Motor 0)
      </Button>
    </div>
  );
}
