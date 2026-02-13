import { useEffect } from "react";
import { useMatchStore, PERIOD_LABELS, type AutoWinner } from "@/store/matchStore";
import { useMatchTimer } from "@/hooks/useMatchTimer";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Loader2, Play, Pause, RotateCcw, Zap } from "lucide-react";

function ConnectionBadge() {
  const status = useMatchStore((s) => s.connectionStatus);
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
        status === "connected" && "border-frc-green/30 text-frc-green",
        status === "disconnected" && "border-destructive/30 text-destructive",
        status === "reconnecting" && "border-frc-orange/30 text-frc-orange",
      )}
    >
      {status === "connected" && <Wifi className="h-3 w-3" />}
      {status === "disconnected" && <WifiOff className="h-3 w-3" />}
      {status === "reconnecting" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "connected" ? "CONNECTED" : status === "reconnecting" ? "RECONNECTING" : "OFFLINE"}
    </div>
  );
}

export default function FullScreenMatch() {
  // This will not tick when Pi is driving (usePiClock=true)
  useMatchTimer();

  const { send } = useWebSocket();

  const {
    period,
    timeRemaining,
    paused,
    redHubStatus,
    blueHubStatus,
    redScore,
    blueScore,
    globalBallCount,
    autoWinner,
  } = useMatchStore();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const canStart = period === "disabled";
  const isRunning = period !== "disabled" && period !== "finished" && !paused;
  const canPause = isRunning;
  const canResume = paused && period !== "disabled" && period !== "finished";

  // Keep theme alliance separate from hub side; hub side is controlled on Pi.
  // If you want, we can add a UI toggle for hub_side later.

  // Auto-winner selector should command the Pi
  const setAutoWinnerOnPi = (w: AutoWinner) => {
    send({ type: "set_auto_winner", winner: w });
  };

  const onStart = () => send({ type: "match_start" });
  const onStopAndReset = () => {
    // Reset = stop match + reset count
    send({ type: "match_stop" });
    send({ type: "reset_count" });
  };
  const onPause = () => send({ type: "match_pause" });
  const onResume = () => send({ type: "match_resume" });

  const onEStop = () => {
    // Your backend e-stop is hardware, but we can at least stop motor + force inactive
    send({ type: "motor", percent: 0 });
    send({ type: "force", mode: "force_inactive" });
  };

  // Optional: show field safe when match finished
  useEffect(() => {
    if (period === "finished") {
      send({ type: "field_safe", mode: "purple" });
    }
  }, [period, send]);

  const periodLabel = PERIOD_LABELS[period] ?? period.toUpperCase();

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em]">FRC HUB</h1>
        <ConnectionBadge />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            RED
          </div>
          <div className="text-6xl font-display font-bold text-alliance-red">{redScore}</div>
          <div className="mt-3 font-mono text-xs text-muted-foreground">HUB: {redHubStatus.toUpperCase()}</div>
        </div>

        {/* Center */}
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {periodLabel}
          </div>
          <div className="text-7xl font-mono font-bold text-frc-green">{timeStr}</div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">BALLS: {globalBallCount}</div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {canStart && (
              <button
                onClick={onStart}
                className="flex items-center gap-2 rounded-sm bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90"
              >
                <Play className="h-4 w-4" /> START MATCH
              </button>
            )}
            {canPause && (
              <button
                onClick={onPause}
                className="flex items-center gap-2 rounded-sm bg-frc-orange px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90"
              >
                <Pause className="h-4 w-4" /> PAUSE
              </button>
            )}
            {canResume && (
              <button
                onClick={onResume}
                className="flex items-center gap-2 rounded-sm bg-frc-green px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90"
              >
                <Play className="h-4 w-4" /> RESUME
              </button>
            )}
            <button
              onClick={onStopAndReset}
              className="flex items-center gap-2 rounded-sm border border-border px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </button>
            <button
              onClick={onEStop}
              className="flex items-center gap-2 rounded-sm bg-destructive px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground transition-all hover:opacity-90"
            >
              <Zap className="h-4 w-4" /> E-STOP
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              AUTO WINNER
            </div>
            <div className="flex justify-center gap-2">
              {(["red", "blue", "tie"] as AutoWinner[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setAutoWinnerOnPi(w)}
                  className={cn(
                    "rounded-sm border px-3 py-2 font-mono text-xs uppercase tracking-widest",
                    autoWinner === w
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="rounded-lg border border-border bg-card p-6 text-right">
          <div className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            BLUE
          </div>
          <div className="text-6xl font-display font-bold text-alliance-blue">{blueScore}</div>
          <div className="mt-3 font-mono text-xs text-muted-foreground">HUB: {blueHubStatus.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}
