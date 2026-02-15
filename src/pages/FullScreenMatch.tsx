import { useMemo, useState, useEffect, useCallback } from "react";
import { useMatchStore, PERIOD_LABELS } from "@/store/matchStore";
import { usePiWs } from "@/ws/PiWsContext";
import { useMatchEffects } from "@/hooks/useMatchEffects";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useMatchAudio } from "@/hooks/useMatchAudio";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Square, Zap, FlaskConical, Volume2, VolumeOff, PartyPopper, Trophy } from "lucide-react";

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

  const { getBps, isBpsFlash, getMaxBps } = useMatchEffects();
  useDemoMode();
  const { setMatchSound, setCelebrationSound, getMatchSoundEnabled, getCelebrationSoundEnabled } = useMatchAudio();

  const isRunning = period !== "disabled" && period !== "finished";
  const canStart = period === "disabled";
  const canPause = isRunning && !paused;
  const canResume = isRunning && paused;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // BPS display — update every 200ms
  const [bps, setBps] = useState(0);
  const [maxBps, setMaxBps] = useState(0);
  const [insaneFlash, setInsaneFlash] = useState(false);
  const [matchSoundOn, setMatchSoundOn] = useState(true);
  const [celebrationSoundOn, setCelebrationSoundOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setBps(getBps());
      setMaxBps(getMaxBps());
      setInsaneFlash(isBpsFlash());
    }, 200);
    return () => clearInterval(id);
  }, [getBps, isBpsFlash, getMaxBps]);

  const toggleMatchSound = useCallback(() => {
    const next = !getMatchSoundEnabled();
    setMatchSoundOn(next);
    setMatchSound(next);
  }, [setMatchSound, getMatchSoundEnabled]);

  const toggleCelebrationSound = useCallback(() => {
    const next = !getCelebrationSoundEnabled();
    setCelebrationSoundOn(next);
    setCelebrationSound(next);
  }, [setCelebrationSound, getCelebrationSoundEnabled]);

  // Demo match start: simulate period transitions
  const handleDemoMatchStart = useCallback(() => {
    if (!demoMode) setDemoMode(true);

    const store = useMatchStore.getState();
    // Reset count
    store.resetCount();

    // Simulate match start by setting period to auto
    // 2026 timing: Auto 20s + Grace 3s + Transition 10s + 4×25s Shifts + Endgame 30s + Grace 3s = 166s
    const TOTAL = 166;

    useMatchStore.setState({
      period: "auto",
      paused: false,
      timeRemaining: TOTAL,
      redHubStatus: "active",
      blueHubStatus: "active",
      globalBallCount: 0,
      scoringEvents: [],
    });

    // Auto period transitions (cumulative delays in ms)
    const transitions: { delay: number; state: Partial<ReturnType<typeof useMatchStore.getState>> }[] = [
      { delay: 20000,  state: { period: "auto_grace" as const, timeRemaining: TOTAL - 20 } },   // 3s grace
      { delay: 23000,  state: { period: "transition" as const, timeRemaining: TOTAL - 23 } },   // 10s transition
      { delay: 33000,  state: { period: "shift1" as const, timeRemaining: TOTAL - 33 } },       // 25s shift1
      { delay: 58000,  state: { period: "shift2" as const, timeRemaining: TOTAL - 58 } },       // 25s shift2
      { delay: 83000,  state: { period: "shift3" as const, timeRemaining: TOTAL - 83 } },       // 25s shift3
      { delay: 108000, state: { period: "shift4" as const, timeRemaining: TOTAL - 108 } },      // 25s shift4
      { delay: 133000, state: { period: "endgame" as const, timeRemaining: TOTAL - 133 } },     // 30s endgame
      { delay: 163000, state: { period: "teleop_grace" as const, timeRemaining: TOTAL - 163 } },// 3s grace
      { delay: 166000, state: { period: "finished" as const, timeRemaining: 0, paused: false } },
    ];

    const timers: number[] = [];
    transitions.forEach(({ delay, state }) => {
      timers.push(window.setTimeout(() => useMatchStore.setState(state), delay));
    });

    // Countdown timer
    let t = TOTAL;
    const countdown = window.setInterval(() => {
      t--;
      if (t <= 0) {
        clearInterval(countdown);
        return;
      }
      useMatchStore.setState({ timeRemaining: t });
    }, 1000);
    timers.push(countdown);

    // Store cleanup refs (simple approach — cleared on next start)
    (window as any).__demoTimers = timers;
  }, [demoMode, setDemoMode]);

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
        <div className="flex items-center gap-3">
          {/* Sound toggles */}
          <button
            onClick={toggleMatchSound}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 font-display text-xs font-bold transition-colors",
              matchSoundOn
                ? "bg-frc-green/20 text-frc-green"
                : "bg-muted text-muted-foreground"
            )}
            title="Match sounds"
          >
            {matchSoundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeOff className="h-3.5 w-3.5" />}
            Match
          </button>
          <button
            onClick={toggleCelebrationSound}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 font-display text-xs font-bold transition-colors",
              celebrationSoundOn
                ? "bg-frc-yellow/20 text-frc-yellow"
                : "bg-muted text-muted-foreground"
            )}
            title="Celebration sounds"
          >
            {celebrationSoundOn ? <PartyPopper className="h-3.5 w-3.5" /> : <VolumeOff className="h-3.5 w-3.5" />}
            Celebration
          </button>

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
          <div className="mt-2 flex items-center gap-6">
            {/* Live BPS */}
            <div
              className={cn(
                "flex items-baseline gap-2 font-mono transition-all duration-200",
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
            {/* Max BPS */}
            {maxBps > 0 && (
              <div className="flex items-baseline gap-1.5 font-mono text-sm text-muted-foreground">
                <Trophy className="inline h-3.5 w-3.5 text-frc-yellow" />
                <span className="tabular-nums font-bold text-frc-yellow">{maxBps}</span>
                <span className="text-xs uppercase tracking-wider">max</span>
              </div>
            )}
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

        {/* Demo controls */}
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

        {demoMode && canStart && (
          <CtrlBtn onClick={handleDemoMatchStart} className="bg-frc-green/80 text-background">
            <Play className="inline-block h-4 w-4 mr-2" />
            Demo Match
          </CtrlBtn>
        )}

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
