import { useMatchStore } from '@/store/matchStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ScoringLog() {
  const { scoringEvents } = useMatchStore();

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
            {scoringEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded px-2 py-1 font-mono text-xs"
              >
                <span className="text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                    event.alliance === 'red'
                      ? 'bg-alliance-red/20 text-alliance-red'
                      : 'bg-alliance-blue/20 text-alliance-blue'
                  )}
                >
                  {event.alliance}
                </span>
                <span className="text-muted-foreground">
                  Sensor {event.sensorId}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
