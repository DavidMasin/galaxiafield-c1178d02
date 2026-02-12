import { useMatchStore } from '@/store/matchStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Power, RotateCw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MotorControl() {
  const { motor, setMotor, triggerEStop } = useMatchStore();

  const handleToggle = () => {
    if (motor.eStop) return;
    if (!motor.safetyInterlock && !motor.enabled) return;
    setMotor({ enabled: !motor.enabled, rpm: motor.enabled ? 0 : motor.targetRpm });
  };

  const handleRpmChange = ([value]: number[]) => {
    setMotor({ targetRpm: value, ...(motor.enabled ? { rpm: value } : {}) });
  };

  const handleScoreSpin = () => {
    if (motor.eStop || !motor.safetyInterlock) return;
    setMotor({ enabled: true, rpm: 500 });
    setTimeout(() => setMotor({ enabled: false, rpm: 0 }), 1500);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        Motor Control
      </h1>

      {/* E-Stop - always prominent */}
      <Button
        onClick={triggerEStop}
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
          <Button
            onClick={() => setMotor({ eStop: false })}
            variant="secondary"
            className="mt-3 font-display text-xs uppercase tracking-wider"
          >
            Reset E-Stop
          </Button>
        </div>
      )}

      {/* Motor toggle + RPM */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Motor State
        </h3>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleToggle}
            disabled={motor.eStop || (!motor.safetyInterlock && !motor.enabled)}
            className={cn(
              'gap-2 font-display text-sm uppercase',
              motor.enabled
                ? 'bg-status-ok text-primary-foreground hover:bg-status-ok/80'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Power size={16} /> {motor.enabled ? 'Running' : 'Off'}
          </Button>
          <div className="font-mono text-lg text-foreground">{motor.rpm} RPM</div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block font-mono text-xs text-muted-foreground">
            Target RPM — {motor.targetRpm}
          </label>
          <Slider
            value={[motor.targetRpm]}
            onValueChange={handleRpmChange}
            min={0}
            max={2000}
            step={50}
            disabled={motor.eStop}
          />
        </div>
      </div>

      {/* Score spin */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Quick Actions
        </h3>
        <Button
          onClick={handleScoreSpin}
          disabled={motor.eStop || !motor.safetyInterlock}
          className="gap-2 bg-frc-orange font-display text-sm uppercase text-primary-foreground hover:bg-frc-orange/80"
        >
          <RotateCw size={16} /> Score Spin
        </Button>
      </div>

      {/* Safety */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Safety
        </h3>
        <div className="flex items-center gap-3">
          <Shield size={16} className={motor.safetyInterlock ? 'text-status-ok' : 'text-status-error'} />
          <span className="font-mono text-sm text-foreground">Safety Interlock</span>
          <Switch
            checked={motor.safetyInterlock}
            onCheckedChange={(v) => setMotor({ safetyInterlock: v })}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Motor cannot be enabled unless safety interlock is active
        </p>
      </div>
    </div>
  );
}
