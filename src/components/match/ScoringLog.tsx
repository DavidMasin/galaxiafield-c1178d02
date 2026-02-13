import { useMatchStore } from '@/store/matchStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type AnyEvent = {
  id: string;
  timestamp: number;       // ms
  // new Pi-driven shape:
  exit?: number;           // 1..4
  count?: number;          // global count
  // old UI shape (if still present somewhere):
  alliance?: 'red' | 'blue';
  sensorId?: number;
};

export default function ScoringLog() {
  // ✅ use selector + fallback to avoid undefined crash
  const scoringEvents = (useMatchStore((s) => (s as any).scoringEvents) ?? []) as AnyEvent[];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Scoring Events
      </h3>

      <ScrollArea className="h-48">
        {scoringEvents.length === 0 ? (
          <p className="py-4 text-center font-mono text-xs text-muted-foreground">
            No scoring events yet
          </p>
        ) : (
          <div className="space-y-1">
            {scoringEvents.map((event) => {
              const timeStr = new Date(event.timestamp).toLocaleTimeString();

              // prefer new fields; fall back to old naming
              const sensor = event.exit ?? event.sensorId ?? 0;

              // alliance is optional now (Pi events are global); show pill only if exists
              const alliance = event.alliance;

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded px-2 py-1 font-mono text-xs"
                >
                  <span className="text-muted-foreground">{timeStr}</span>

                  {alliance ? (
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                        alliance === 'red'
                          ? 'bg-alliance-red/20 text-alliance-red'
                          : 'bg-alliance-blue/20 text-alliance-blue'
                      )}
                    >
                      {alliance}
                    </span>
                  ) : (
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-muted/30 text-muted-foreground">
                      GLOBAL
                    </span>
                  )}

                  <span className="text-muted-foreground">Sensor {sensor}</span>

                  {typeof event.count === 'number' && (
                    <span className="ml-auto text-muted-foreground">#{event.count}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
