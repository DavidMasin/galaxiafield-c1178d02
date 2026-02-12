import { useMatchStore, type LedMode } from '@/store/matchStore';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

const ledModes: { value: LedMode; label: string; color: string }[] = [
  { value: 'idle', label: 'Idle', color: 'bg-muted-foreground' },
  { value: 'alliance_red', label: 'Alliance Red', color: 'bg-alliance-red' },
  { value: 'alliance_blue', label: 'Alliance Blue', color: 'bg-alliance-blue' },
  { value: 'scoring', label: 'Scoring Flash', color: 'bg-frc-yellow' },
  { value: 'countdown', label: 'Countdown', color: 'bg-frc-orange' },
  { value: 'endgame', label: 'Endgame', color: 'bg-frc-orange' },
  { value: 'error', label: 'Error', color: 'bg-destructive' },
];

export default function LedControl() {
  const { ledMode, ledBrightness, setLedMode, setLedBrightness } = useMatchStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        LED Control
      </h1>

      {/* Mode selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Animation Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ledModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setLedMode(mode.value)}
              className={cn(
                'flex items-center gap-3 rounded-md border px-4 py-3 text-left font-mono text-sm transition-all',
                ledMode === mode.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
              )}
            >
              <div className={cn('h-3 w-3 rounded-full', mode.color)} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Preview
        </h3>
        <LedPreview mode={ledMode} brightness={ledBrightness} />
      </div>

      {/* Brightness */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Brightness — {ledBrightness}%
        </h3>
        <Slider
          value={[ledBrightness]}
          onValueChange={([v]) => setLedBrightness(v)}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  );
}

function LedPreview({ mode, brightness }: { mode: LedMode; brightness: number }) {
  const getColor = () => {
    switch (mode) {
      case 'alliance_red': return 'bg-alliance-red';
      case 'alliance_blue': return 'bg-alliance-blue';
      case 'scoring': return 'bg-frc-yellow';
      case 'countdown': return 'bg-frc-orange';
      case 'endgame': return 'bg-frc-orange';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const isAnimated = mode === 'scoring' || mode === 'countdown' || mode === 'endgame';

  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-8 w-3 rounded-sm transition-all',
            getColor(),
            isAnimated && 'animate-pulse-glow'
          )}
          style={{ opacity: brightness / 100, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
