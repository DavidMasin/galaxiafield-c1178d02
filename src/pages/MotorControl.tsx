import { useMatchStore, type MotorState } from '@/store/matchStore';
import { usePiWs } from '@/ws/PiWsContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MotorControl() {
  const motor = useMatchStore((s) => s.motor);
  const { send } = usePiWs();

  const handleToggle = () => {
    if (motor.eStop) return;
    send({ type: "motor", percent: motor.enabled ? 0 : motor.percent || 0.5 });
  };

  const handlePercentChange = ([value]: number[]) => {
    send({ type: "motor", percent: value / 100 });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        Motor Control
      </h1>

      <Button
        onClick={() => send({ type: "motor", percent: 0 })}
        className={cn(
          'h-20 gap-3 border-2 border-destructive bg-destructive font-display text-xl font-bold uppercase tracking-wider text-destructive-foreground hover:bg-destructive/80',
          'shadow-[0_0_30px_hsl(var(--destructive)/0.5)]'
        )}
      >
        <AlertTriangle size={28} /> EMERGENCY STOP
      </Button>

      {motor.eStop && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="font-display text-sm font-bold text-destructive">
            E-STOP ENGAGED — Motor disabled
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Motor State
        </h3>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleToggle}
            disabled={motor.eStop}
            className={cn(
              'gap-2 font-display text-sm uppercase',
              motor.enabled
                ? 'bg-status-ok text-primary-foreground hover:bg-status-ok/80'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Power size={16} /> {motor.enabled ? 'Running' : 'Off'}
          </Button>
          <div className="font-mono text-lg text-foreground">{Math.round(motor.percent * 100)}%</div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block font-mono text-xs text-muted-foreground">
            Power — {Math.round(motor.percent * 100)}%
          </label>
          <Slider
            value={[Math.round(motor.percent * 100)]}
            onValueChange={handlePercentChange}
            min={0}
            max={100}
            step={5}
            disabled={motor.eStop}
          />
        </div>
      </div>
    </div>
  );
}
