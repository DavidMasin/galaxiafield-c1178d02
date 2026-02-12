import { useMatchStore, PERIOD_LABELS, type MatchPeriod } from '@/store/matchStore';
import { Button } from '@/components/ui/button';
import { Play, Square, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MatchControls() {
  const { period, paused, startMatch, pauseMatch, resumeMatch, resetMatch, triggerEStop } = useMatchStore();

  const isRunning = period !== 'disabled' && period !== 'finished' && !paused;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {period === 'disabled' && (
        <Button
          onClick={startMatch}
          className="gap-2 bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
          size="lg"
        >
          <Play size={18} /> Start Match
        </Button>
      )}

      {isRunning && (
        <Button
          onClick={pauseMatch}
          className="gap-2 bg-frc-orange px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-orange/80"
          size="lg"
        >
          <Pause size={18} /> Pause
        </Button>
      )}

      {paused && period !== 'disabled' && period !== 'finished' && (
        <Button
          onClick={resumeMatch}
          className="gap-2 bg-frc-green px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
          size="lg"
        >
          <Play size={18} /> Resume
        </Button>
      )}

      {(period !== 'disabled') && (
        <Button
          onClick={resetMatch}
          variant="secondary"
          className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
          size="lg"
        >
          <RotateCcw size={18} /> Reset
        </Button>
      )}

      <Button
        onClick={triggerEStop}
        className={cn(
          'gap-2 border-2 border-destructive bg-destructive px-6 font-display text-sm font-bold uppercase tracking-wider text-destructive-foreground hover:bg-destructive/80',
          'shadow-[0_0_20px_hsl(var(--destructive)/0.4)]'
        )}
        size="lg"
      >
        <AlertTriangle size={18} /> E-STOP
      </Button>
    </div>
  );
}
