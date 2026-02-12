import { cn } from '@/lib/utils';
import { useMatchStore, PERIOD_LABELS, type MatchPeriod } from '@/store/matchStore';

const periodColors: Record<string, string> = {
  disabled: 'text-muted-foreground',
  auto: 'text-frc-yellow',
  auto_grace: 'text-frc-yellow',
  transition: 'text-primary',
  shift1: 'text-frc-green',
  shift2: 'text-frc-green',
  shift3: 'text-frc-green',
  shift4: 'text-frc-green',
  endgame: 'text-frc-orange',
  teleop_grace: 'text-frc-orange',
  finished: 'text-muted-foreground',
};

export default function MatchTimer() {
  const { period, timeRemaining } = useMatchStore();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isUrgent = period === 'endgame' && timeRemaining <= 10;
  const color = periodColors[period] || 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('font-display text-xs font-bold uppercase tracking-[0.25em]', color)}>
        {PERIOD_LABELS[period]}
      </span>
      <span
        className={cn(
          'font-mono text-6xl font-bold tabular-nums tracking-wider',
          color,
          isUrgent && 'animate-pulse-glow text-destructive'
        )}
      >
        {period === 'disabled' || period === 'finished' ? '--:--' : timeStr}
      </span>
    </div>
  );
}
