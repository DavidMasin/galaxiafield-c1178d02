import { useMatchStore } from '@/store/matchStore';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Zap } from 'lucide-react';

export default function SystemStatus() {
  const { sensors, connectionStatus, ledMode, motor, demoMode } = useMatchStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        System Status
      </h1>

      {/* Connection */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Connection
        </h3>
        <div className="flex items-center gap-3">
          {connectionStatus === 'connected' ? (
            <Wifi className="text-status-ok" size={20} />
          ) : connectionStatus === 'simulated' ? (
            <Zap className="text-status-warn" size={20} />
          ) : (
            <WifiOff className="text-status-error" size={20} />
          )}
          <span className="font-mono text-sm text-foreground">
            {connectionStatus === 'simulated' ? 'DEMO MODE' : connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Sensors */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Sensors
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {sensors.map((sensor) => (
            <div
              key={sensor.id}
              className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 px-4 py-3"
            >
              <div
                className={cn(
                  'h-3 w-3 rounded-full',
                  sensor.health === 'ok' && 'bg-status-ok',
                  sensor.health === 'warn' && 'bg-status-warn animate-pulse-glow',
                  sensor.health === 'error' && 'bg-status-error',
                  sensor.health === 'offline' && 'bg-status-offline'
                )}
              />
              <div>
                <p className="font-mono text-sm text-foreground">{sensor.name}</p>
                <p className="font-mono text-xs text-muted-foreground uppercase">
                  {sensor.health}
                  {sensor.lastTrigger && (
                    <> · Last: {new Date(sensor.lastTrigger).toLocaleTimeString()}</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LED Status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          LED Strip
        </h3>
        <p className="font-mono text-sm text-foreground">
          Mode: <span className="text-primary">{ledMode.toUpperCase().replace('_', ' ')}</span>
        </p>
      </div>

      {/* Motor Status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Motor
        </h3>
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div>
            State:{' '}
            <span className={motor.enabled ? 'text-status-ok' : 'text-muted-foreground'}>
              {motor.enabled ? 'RUNNING' : 'OFF'}
            </span>
          </div>
          <div>RPM: <span className="text-foreground">{motor.rpm}</span></div>
          <div>Current: <span className="text-foreground">{motor.currentDraw.toFixed(1)}A</span></div>
          <div>
            E-Stop:{' '}
            <span className={motor.eStop ? 'text-destructive' : 'text-status-ok'}>
              {motor.eStop ? 'ENGAGED' : 'CLEAR'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
