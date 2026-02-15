import { useMemo, useState, useEffect } from "react";
import { useMatchStore, PERIOD_LABELS } from "@/store/matchStore";
import { usePiWs } from "@/ws/PiWsContext";
import { useMatchEffects } from "@/hooks/useMatchEffects";
import { useDemoMode } from "@/hooks/useDemoMode";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Square, Zap, FlaskConical } from "lucide-react";

export default function FullScreenMatch() {
  const { send } = usePiWs();

  const period = useMatchStore((s) => s.period);
  const paused = useMatchStore((s) => s.paused);
  const timeRemaining = useMatchStore((s) => s.timeRemaining);
  const globalBallCount = useMatchStore((s) => s.globalBallCount);
  const redHubStatus = useMatchStore((s) => s.redHubStatus);
  const blueHubStatus = useMatchStore((s) => s.blueHubStatus);
  const ledMode = useMatchStore((s) => s.ledMode);
  const demoMode = useMatchStore((s) => s.demoMode);
  const setDemoMode = useMatchStore((s) => s.setDemoMode);

  const { getBps, isBpsFlash } = useMatchEffects();
  useDemoMode();

  const isRunning = period !== "disabled" && period !== "finished";
  const canStart = period === "disabled";
  const canPause = isRunning && !paused;
  const canResume = isRunning && paused;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // BPS display — update every 200ms
  const [bps, setBps] = useState(0);
  const [insaneFlash, setInsaneFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBps(getBps());
      setInsaneFlash(isBpsFlash());
    }, 200);
    return () => clearInterval(id);
  }, [getBps, isBpsFlash]);

  const periodColor = useMemo(() => {
    if (period === "auto" || period === "auto_grace") return "text-frc-yellow";
    if (period === "transition") return "text-primary";
    if (period.startsWith("shift")) return "text-frc-green";
    if (period === "endgame" || period === "teleop_grace") return "text-frc-orange";
    if (period === "finished") return "text-purple-400";
    return "text-muted-foreground";
  }, [period]);

  return (
    <div
      className={cn(
        "relative flex h-screen w-screen flex-col bg-background p-6 select-none overflow-hidden",
        ledMode.startsWith("pulse") && "animate-pulse-glow"
      )}
    >
      {/* Insane BPS flash overlay */}
      {insaneFlash && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce text-center">
            <div className="font-display text-[5rem] font-black text-frc-orange drop-shadow-[0_0_40px_hsl(var(--frc-orange)/0.8)]" style={{ animation: "insane-pulse 0.3s ease-in-out infinite alternate" }}>
              {bps}+ BPS!!!
            </div>
            <div className="font-display text-2xl font-bold tracking-[0.5em] text-frc-yellow">
              INSANE SCORING
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-display text-lg font-bold uppercase tracking-[0.3em] text-foreground">
          FRC HUB
        </div>
        <div className="flex items-center gap-4">
          {demoMode && (
            <span className="rounded bg-frc-orange/20 px-2 py-0.5 font-display text-xs font-bold text-frc-orange">
              DEMO
            </span>
          )}
          <div className="font-mono text-sm text-muted-foreground">
            LED: {ledMode}
          </div>
        </div>
      </div>

      {/* Main content */}
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

        {/* Ball count + BPS */}
        <div className="flex flex-col items-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            BALLS SCORED
          </div>
          <div
            className={cn(
              "font-display text-[6rem] font-extrabold leading-none text-foreground transition-all duration-200",
              insaneFlash && "text-frc-orange scale-110"
            )}
          >
            {globalBallCount}
          </div>
          <div
            className={cn(
              "mt-2 flex items-baseline gap-2 font-mono transition-all duration-200",
              bps >= 10
                ? "text-2xl font-bold text-frc-orange"
                : bps >= 5
                ? "text-xl text-frc-yellow"
                : "text-sm text-muted-foreground"
            )}
          >
            <span className="tabular-nums">{bps}</span>
            <span className="text-xs uppercase tracking-wider">balls/sec</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {canStart && (
          <CtrlBtn onClick={() => send({ type: "match_start" })} className="bg-frc-green text-background">
            <Play className="inline-block h-4 w-4 mr-2" />
            Start
          </CtrlBtn>
        )}

        {canPause && (
          <CtrlBtn onClick={() => send({ type: "match_pause" })} className="bg-frc-orange text-background">
            <Pause className="inline-block h-4 w-4 mr-2" />
            Pause
          </CtrlBtn>
        )}

        {canResume && (
          <CtrlBtn onClick={() => send({ type: "match_resume" })} className="bg-frc-green text-background">
            <Play className="inline-block h-4 w-4 mr-2" />
            Resume
          </CtrlBtn>
        )}

        {isRunning && (
          <CtrlBtn onClick={() => send({ type: "match_stop" })} className="border border-border text-muted-foreground hover:text-foreground">
            <Square className="inline-block h-4 w-4 mr-2" />
            Stop
          </CtrlBtn>
        )}

        <CtrlBtn onClick={() => send({ type: "reset_count" })} className="border border-border text-muted-foreground hover:text-foreground">
          <RotateCcw className="inline-block h-4 w-4 mr-2" />
          Reset
        </CtrlBtn>

        <CtrlBtn onClick={() => send({ type: "force", mode: "force_active" })} className="border border-border text-muted-foreground hover:text-foreground">
          Force Active
        </CtrlBtn>

        <CtrlBtn onClick={() => send({ type: "force", mode: null })} className="border border-border text-muted-foreground hover:text-foreground">
          Force Off
        </CtrlBtn>

        <CtrlBtn
          onClick={() => setDemoMode(!demoMode)}
          className={cn(
            "border",
            demoMode
              ? "border-frc-orange bg-frc-orange/20 text-frc-orange"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className="inline-block h-4 w-4 mr-2" />
          Demo {demoMode ? "ON" : "Off"}
        </CtrlBtn>

        <CtrlBtn onClick={() => send({ type: "motor", percent: 0 })} className="bg-destructive text-destructive-foreground">
          <Zap className="inline-block h-4 w-4 mr-2" />
          E-STOP
        </CtrlBtn>
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, className, children }: { onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-sm px-6 py-3 font-display text-sm font-bold uppercase tracking-wider hover:opacity-90", className)}
    >
      {children}
    </button>
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
