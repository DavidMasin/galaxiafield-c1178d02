import { useMatchStore } from '@/store/matchStore';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function SystemStatus() {
  const { connectionStatus, ledMode, motor, redHubStatus, blueHubStatus, period } = useMatchStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        System Status
      </h1>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Connection
        </h3>
        <div className="flex items-center gap-3">
          {connectionStatus === 'connected' ? (
            <Wifi className="text-status-ok" size={20} />
          ) : connectionStatus === 'reconnecting' ? (
            <Loader2 className="text-status-warn animate-spin" size={20} />
          ) : (
            <WifiOff className="text-status-error" size={20} />
          )}
          <span className="font-mono text-sm text-foreground">
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Hub Status
        </h3>
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-3 w-3 rounded-full',
              redHubStatus === 'active' && 'bg-alliance-red',
              redHubStatus === 'warning' && 'bg-alliance-red animate-pulse',
              redHubStatus === 'inactive' && 'bg-muted',
            )} />
            Red Hub: <span className="text-foreground">{redHubStatus.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-3 w-3 rounded-full',
              blueHubStatus === 'active' && 'bg-alliance-blue',
              blueHubStatus === 'warning' && 'bg-alliance-blue animate-pulse',
              blueHubStatus === 'inactive' && 'bg-muted',
            )} />
            Blue Hub: <span className="text-foreground">{blueHubStatus.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          LED Strip
        </h3>
        <p className="font-mono text-sm text-foreground">
          Mode: <span className="text-primary">{ledMode.toUpperCase().replace('_', ' ')}</span>
        </p>
      </div>

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
          <div>Power: <span className="text-foreground">{Math.round(motor.percent * 100)}%</span></div>
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
