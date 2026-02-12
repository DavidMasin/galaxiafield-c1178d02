import { cn } from '@/lib/utils';
import { useMatchStore, type MatchPhase } from '@/store/matchStore';

const phaseLabels: Record<MatchPhase, string> = {
  disabled: 'DISABLED',
  auto: 'AUTONOMOUS',
  teleop: 'TELEOPERATED',
  endgame: 'ENDGAME',
  finished: 'MATCH OVER',
};

const phaseColors: Record<MatchPhase, string> = {
  disabled: 'text-muted-foreground',
  auto: 'text-frc-yellow',
  teleop: 'text-frc-green',
  endgame: 'text-frc-orange',
  finished: 'text-muted-foreground',
};

export default function MatchTimer() {
  const { phase, timeRemaining } = useMatchStore();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isUrgent = phase === 'endgame' && timeRemaining <= 10;

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          'font-display text-xs font-bold uppercase tracking-[0.25em]',
          phaseColors[phase]
        )}
      >
        {phaseLabels[phase]}
      </span>
      <span
        className={cn(
          'font-mono text-6xl font-bold tabular-nums tracking-wider',
          phaseColors[phase],
          isUrgent && 'animate-pulse-glow text-destructive'
        )}
      >
        {phase === 'disabled' || phase === 'finished' ? '--:--' : timeStr}
      </span>
    </div>
  );
}
