import { useMatchStore } from '@/store/matchStore';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    demoMode, setDemoMode,
    piAddress, setPiAddress,
    piPort, setPiPort,
    timing, setTiming,
    alliance, setAlliance,
  } = useMatchStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        Settings
      </h1>

      {/* Demo mode */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Simulation
        </h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground">Demo Mode</span>
          <Switch checked={demoMode} onCheckedChange={setDemoMode} />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          When enabled, simulated scoring events are generated automatically
        </p>
      </div>

      {/* Pi Connection */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Pi Connection
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-mono text-xs text-muted-foreground">IP Address</label>
            <Input
              value={piAddress}
              onChange={(e) => setPiAddress(e.target.value)}
              className="font-mono text-sm"
              placeholder="192.168.1.100"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs text-muted-foreground">Port</label>
            <Input
              type="number"
              value={piPort}
              onChange={(e) => setPiPort(parseInt(e.target.value) || 0)}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Match Timing */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Match Timing (seconds)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block font-mono text-xs text-muted-foreground">Auto</label>
            <Input
              type="number"
              value={timing.autoDuration}
              onChange={(e) => setTiming({ autoDuration: parseInt(e.target.value) || 0 })}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs text-muted-foreground">Teleop</label>
            <Input
              type="number"
              value={timing.teleopDuration}
              onChange={(e) => setTiming({ teleopDuration: parseInt(e.target.value) || 0 })}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs text-muted-foreground">Endgame</label>
            <Input
              type="number"
              value={timing.endgameDuration}
              onChange={(e) => setTiming({ endgameDuration: parseInt(e.target.value) || 0 })}
              className="font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Alliance */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Alliance
        </h3>
        <div className="flex gap-3">
          <Button
            onClick={() => setAlliance('red')}
            className={cn(
              'font-display text-sm uppercase tracking-wider',
              alliance === 'red'
                ? 'bg-alliance-red text-primary-foreground hover:bg-alliance-red/80'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            Red Alliance
          </Button>
          <Button
            onClick={() => setAlliance('blue')}
            className={cn(
              'font-display text-sm uppercase tracking-wider',
              alliance === 'blue'
                ? 'bg-alliance-blue text-primary-foreground hover:bg-alliance-blue/80'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            Blue Alliance
          </Button>
        </div>
      </div>
    </div>
  );
}
