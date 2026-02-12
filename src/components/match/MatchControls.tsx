import { useMatchStore } from '@/store/matchStore';
import { Button } from '@/components/ui/button';
import { Play, Square, FastForward, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MatchControls() {
  const { phase, startMatch, setPhase, resetMatch, triggerEStop } = useMatchStore();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {phase === 'disabled' && (
        <Button
          onClick={startMatch}
          className="gap-2 bg-frc-green px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
          size="lg"
        >
          <Play size={18} /> Start Match
        </Button>
      )}

      {phase === 'auto' && (
        <Button
          onClick={() => setPhase('teleop')}
          className="gap-2 bg-frc-green px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-green/80"
          size="lg"
        >
          <FastForward size={18} /> Skip to Teleop
        </Button>
      )}

      {phase === 'teleop' && (
        <Button
          onClick={() => setPhase('endgame')}
          className="gap-2 bg-frc-orange px-6 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-frc-orange/80"
          size="lg"
        >
          <FastForward size={18} /> Endgame
        </Button>
      )}

      {(phase === 'auto' || phase === 'teleop' || phase === 'endgame') && (
        <Button
          onClick={() => setPhase('finished')}
          variant="secondary"
          className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
          size="lg"
        >
          <Square size={18} /> End Match
        </Button>
      )}

      {phase === 'finished' && (
        <Button
          onClick={resetMatch}
          variant="secondary"
          className="gap-2 font-display text-sm font-bold uppercase tracking-wider"
          size="lg"
        >
          <RotateCcw size={18} /> Reset
        </Button>
      )}

      {/* E-Stop always visible */}
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
