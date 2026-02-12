import { useEffect, useCallback } from 'react';
import { useMatchStore, PERIOD_LABELS, type AutoWinner, type MatchPeriod } from '@/store/matchStore';
import { useMatchTimer } from '@/hooks/useMatchTimer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, Circle, AlertTriangle, Play, Pause, RotateCcw, Zap } from 'lucide-react';

/* ── LED animation CSS classes (driven by ledMode) ── */
const ledAnimationClass: Record<string, string> = {
  off: '',
  solid_red: 'led-solid-red',
  solid_blue: 'led-solid-blue',
  pulse_red: 'led-pulse-red',
  pulse_blue: 'led-pulse-blue',
  chase_red: 'led-chase-red',
  chase_blue: 'led-chase-blue',
  green: 'led-green',
  purple: 'led-purple',
  idle: '',
};

function HubIndicator({ alliance, status }: { alliance: 'red' | 'blue'; status: string }) {
  const isRed = alliance === 'red';
  const label = alliance.toUpperCase();
  const baseColor = isRed ? 'bg-alliance-red' : 'bg-alliance-blue';
  const dimColor = isRed ? 'bg-alliance-red-dim' : 'bg-alliance-blue-dim';
  const glowClass = isRed ? 'glow-red' : 'glow-blue';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={cn(
        'font-display text-xs font-bold uppercase tracking-[0.3em]',
        isRed ? 'text-alliance-red' : 'text-alliance-blue'
      )}>
        {label} HUB
      </span>
      <div className={cn(
        'h-6 w-24 rounded-sm transition-all duration-300',
        status === 'active' && cn(baseColor, glowClass),
        status === 'warning' && cn(baseColor, 'animate-pulse-glow', glowClass),
        status === 'inactive' && cn(dimColor, 'opacity-30'),
      )} />
      <span className={cn(
        'font-mono text-[10px] uppercase tracking-widest',
        status === 'active' && 'text-frc-green',
        status === 'warning' && 'text-frc-orange animate-pulse',
        status === 'inactive' && 'text-muted-foreground',
      )}>
        {status === 'warning' ? 'DEACTIVATING' : status.toUpperCase()}
      </span>
    </div>
  );
}

function ConnectionBadge() {
  const status = useMatchStore((s) => s.connectionStatus);
  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider',
      status === 'connected' && 'border-frc-green/30 text-frc-green',
      status === 'disconnected' && 'border-destructive/30 text-destructive',
      status === 'reconnecting' && 'border-frc-orange/30 text-frc-orange',
    )}>
      {status === 'connected' && <Wifi className="h-3 w-3" />}
      {status === 'disconnected' && <WifiOff className="h-3 w-3" />}
      {status === 'reconnecting' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'connected' ? 'CONNECTED' : status === 'reconnecting' ? 'RECONNECTING' : 'OFFLINE'}
    </div>
  );
}

export default function FullScreenMatch() {
  useMatchTimer();
  const { send } = useWebSocket();

  const {
    period, timeRemaining, paused,
    redHubStatus, blueHubStatus,
    redScore, blueScore, globalBallCount,
    autoWinner, autoWinnerLocked, shiftInactiveFirst,
    ledMode, alliance, connectionStatus, motor,
    startMatch, pauseMatch, resumeMatch, resetMatch,
    setAutoWinner, setAlliance,
    setRedHubOverride, setBlueHubOverride,
    triggerEStop,
  } = useMatchStore();

  // Send match state to Pi on period change
  useEffect(() => {
    if (period !== 'disabled' && period !== 'finished') {
      send({ type: 'match_state', state: period, time_left: timeRemaining });
    }
    // Send LED mode
    const modeMap: Record<string, string> = {
      off: 'off', solid_red: 'solid_red', solid_blue: 'solid_blue',
      pulse_red: 'pulse_red', pulse_blue: 'pulse_blue',
      chase_red: 'chase_red', chase_blue: 'chase_blue',
      green: 'green', purple: 'purple', idle: 'idle',
    };
    send({ type: 'set_led_mode', mode: modeMap[ledMode] || 'idle' });
  }, [period, ledMode, send]);

  // Send alliance on change
  useEffect(() => {
    send({ type: 'set_alliance', alliance });
  }, [alliance, send]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isRunning = period !== 'disabled' && period !== 'finished' && !paused;
  const canStart = period === 'disabled';
  const canPause = isRunning;
  const canResume = paused && period !== 'disabled' && period !== 'finished';

  const periodColor = (() => {
    if (period === 'auto' || period === 'auto_grace') return 'text-frc-yellow';
    if (period === 'transition') return 'text-primary';
    if (period.startsWith('shift')) return 'text-frc-green';
    if (period === 'endgame') return 'text-frc-orange';
    if (period === 'teleop_grace') return 'text-frc-orange';
    return 'text-muted-foreground';
  })();

  const isEndgameUrgent = period === 'endgame' && timeRemaining <= 10;

  // Handle auto winner selection
  const handleAutoWinner = useCallback((w: AutoWinner) => {
    setAutoWinner(w);
  }, [setAutoWinner]);

  return (
    <div className={cn(
      'relative flex h-screen w-screen flex-col items-center justify-between bg-background scanline select-none overflow-hidden p-6',
      ledAnimationClass[ledMode]
    )}>
      {/* ── Top Bar ── */}
      <div className="flex w-full items-center justify-between">
        {/* Left: Alliance selector + Connection */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button
              onClick={() => setAlliance('red')}
              className={cn(
                'rounded-sm px-3 py-1 font-display text-xs font-bold uppercase tracking-wider transition-all',
                alliance === 'red'
                  ? 'bg-alliance-red text-primary-foreground glow-red'
                  : 'border border-alliance-red-dim text-alliance-red-dim hover:text-alliance-red'
              )}
            >
              RED
            </button>
            <button
              onClick={() => setAlliance('blue')}
              className={cn(
                'rounded-sm px-3 py-1 font-display text-xs font-bold uppercase tracking-wider transition-all',
                alliance === 'blue'
                  ? 'bg-alliance-blue text-primary-foreground glow-blue'
                  : 'border border-alliance-blue-dim text-alliance-blue-dim hover:text-alliance-blue'
              )}
            >
              BLUE
            </button>
          </div>
          <ConnectionBadge />
        </div>

        {/* Center: Period */}
        <div className="flex flex-col items-center">
          <span className={cn('font-display text-2xl font-bold uppercase tracking-[0.4em]', periodColor)}>
            {PERIOD_LABELS[period]}
          </span>
          {paused && (
            <span className="font-mono text-xs text-frc-orange animate-pulse tracking-widest">PAUSED</span>
          )}
        </div>

        {/* Right: Hub overrides */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[8px] text-muted-foreground uppercase">Red Override</span>
            <select
              value={useMatchStore.getState().redHubOverride}
              onChange={(e) => setRedHubOverride(e.target.value as any)}
              className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-foreground"
            >
              <option value="none">Auto</option>
              <option value="force_active">Force Active</option>
              <option value="force_inactive">Force Inactive</option>
            </select>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[8px] text-muted-foreground uppercase">Blue Override</span>
            <select
              value={useMatchStore.getState().blueHubOverride}
              onChange={(e) => setBlueHubOverride(e.target.value as any)}
              className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-foreground"
            >
              <option value="none">Auto</option>
              <option value="force_active">Force Active</option>
              <option value="force_inactive">Force Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {/* Timer */}
        <motion.span
          className={cn(
            'font-mono text-[10rem] font-bold leading-none tabular-nums tracking-wider',
            periodColor,
            isEndgameUrgent && 'animate-pulse-glow text-destructive'
          )}
          key={period}
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {period === 'disabled' || period === 'finished' ? '--:--' : timeStr}
        </motion.span>

        {/* Hub status indicators */}
        <div className="flex gap-16">
          <HubIndicator alliance="red" status={redHubStatus} />
          <HubIndicator alliance="blue" status={blueHubStatus} />
        </div>

        {/* Global Ball Counter */}
        <div className="mt-4 flex flex-col items-center">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            BALLS SCORED
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={globalBallCount}
              initial={{ scale: 1.4, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-[7rem] font-extrabold leading-none text-foreground"
            >
              {globalBallCount}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Alliance Scores */}
        <div className="flex gap-20">
          <div className="flex flex-col items-center">
            <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-alliance-red">Red</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={redScore}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-score text-[5rem] leading-none text-alliance-red"
              >
                {redScore}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-alliance-blue">Blue</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={blueScore}
                initial={{ scale: 1.3, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-score text-[5rem] leading-none text-alliance-blue"
              >
                {blueScore}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="flex w-full items-end justify-between">
        {/* Left: Auto Winner Selector */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Auto Winner {autoWinnerLocked && '(Locked)'}
          </span>
          <div className="flex gap-1">
            {(['red', 'blue', 'tie'] as AutoWinner[]).map((w) => (
              <button
                key={w}
                disabled={autoWinnerLocked}
                onClick={() => handleAutoWinner(w)}
                className={cn(
                  'rounded-sm px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all',
                  autoWinner === w
                    ? w === 'red' ? 'bg-alliance-red text-primary-foreground'
                      : w === 'blue' ? 'bg-alliance-blue text-primary-foreground'
                      : 'bg-muted text-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground',
                  autoWinnerLocked && 'opacity-50 cursor-not-allowed'
                )}
              >
                {w === 'tie' ? 'TIE' : `${w.toUpperCase()} WINS`}
              </button>
            ))}
          </div>
          {shiftInactiveFirst && (
            <span className="font-mono text-[8px] text-muted-foreground">
              Shift 1 inactive: {shiftInactiveFirst.toUpperCase()}
            </span>
          )}
        </div>

        {/* Center: Match Controls */}
        <div className="flex items-center gap-3">
          {canStart && (
            <button
              onClick={startMatch}
              className="flex items-center gap-2 rounded-sm bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90 glow-green"
            >
              <Play className="h-4 w-4" /> START MATCH
            </button>
          )}
          {canPause && (
            <button
              onClick={pauseMatch}
              className="flex items-center gap-2 rounded-sm bg-frc-orange px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90"
            >
              <Pause className="h-4 w-4" /> PAUSE
            </button>
          )}
          {canResume && (
            <button
              onClick={resumeMatch}
              className="flex items-center gap-2 rounded-sm bg-frc-green px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background transition-all hover:opacity-90 glow-green"
            >
              <Play className="h-4 w-4" /> RESUME
            </button>
          )}
          <button
            onClick={resetMatch}
            className="flex items-center gap-2 rounded-sm border border-border px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" /> RESET
          </button>
          <button
            onClick={triggerEStop}
            className="flex items-center gap-2 rounded-sm bg-destructive px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground transition-all hover:opacity-90 shadow-lg shadow-destructive/30"
          >
            <Zap className="h-4 w-4" /> E-STOP
          </button>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            LED: {ledMode.replace('_', ' ').toUpperCase()}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            FRC HUB CONTROL SYSTEM v2026
          </span>
        </div>
      </div>
    </div>
  );
}
