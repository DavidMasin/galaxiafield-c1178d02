import { useMatchStore, type LedMode } from '@/store/matchStore';
import { cn } from '@/lib/utils';

const ledModes: { value: LedMode; label: string; color: string }[] = [
  { value: 'idle', label: 'Idle', color: 'bg-muted-foreground' },
  { value: 'off', label: 'Off', color: 'bg-muted' },
  { value: 'solid_red', label: 'Solid Red', color: 'bg-alliance-red' },
  { value: 'solid_blue', label: 'Solid Blue', color: 'bg-alliance-blue' },
  { value: 'pulse_red', label: 'Pulse Red', color: 'bg-alliance-red' },
  { value: 'pulse_blue', label: 'Pulse Blue', color: 'bg-alliance-blue' },
  { value: 'chase_red', label: 'Chase Red', color: 'bg-alliance-red' },
  { value: 'chase_blue', label: 'Chase Blue', color: 'bg-alliance-blue' },
  { value: 'green', label: 'Field Safe', color: 'bg-frc-green' },
  { value: 'purple', label: 'Post-Match', color: 'bg-purple-500' },
];

export default function LedControl() {
  const ledMode = useMatchStore((s) => s.ledMode);

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        LED Control
      </h1>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Current Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ledModes.map((mode) => (
            <div
              key={mode.value}
              className={cn(
                'flex items-center gap-3 rounded-md border px-4 py-3 font-mono text-sm',
                ledMode === mode.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              )}
            >
              <div className={cn('h-3 w-3 rounded-full', mode.color)} />
              {mode.label}
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          LED mode is controlled automatically by the match state machine.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Preview
        </h3>
        <LedPreview mode={ledMode} />
      </div>
    </div>
  );
}

function LedPreview({ mode }: { mode: LedMode }) {
  const getColor = () => {
    switch (mode) {
      case 'solid_red': case 'pulse_red': case 'chase_red': return 'bg-alliance-red';
      case 'solid_blue': case 'pulse_blue': case 'chase_blue': return 'bg-alliance-blue';
      case 'green': return 'bg-frc-green';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-muted-foreground';
    }
  };

  const isAnimated = mode.startsWith('pulse') || mode.startsWith('chase');

  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-8 w-3 rounded-sm transition-all',
            mode === 'off' ? 'bg-muted opacity-20' : getColor(),
            isAnimated && 'animate-pulse-glow'
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
