import { useMatchStore } from "@/store/matchStore";
import { cn } from "@/lib/utils";
import { usePiWs } from "@/ws/PiWsContext";

/**
 * Settings is a UI mirror of Pi state.
 *
 * Important:
 * - The Pi is the single source of truth.
 * - We do NOT keep a local "alliance" selection in the UI.
 * - These buttons send commands to the Pi to change `match.hub_side`.
 */
export default function SettingsPage() {
  const { send } = usePiWs();
  const hubSide = useMatchStore((s) => s.hubSide);

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
        Settings
      </h1>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Connection
        </h3>
        <p className="font-mono text-sm text-foreground">
          WebSocket: <span className="text-primary">ws://10.59.87.50:5805</span>
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Auto-reconnect enabled. LAN-only operation.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Hub Side
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => send({ type: "set_hub_side", alliance: "red" })}
            className={cn(
              "rounded-sm px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
              hubSide === "red"
                ? "bg-alliance-red text-primary-foreground glow-red"
                : "border border-border bg-secondary text-secondary-foreground"
            )}
          >
            Red Alliance
          </button>
          <button
            onClick={() => send({ type: "set_hub_side", alliance: "blue" })}
            className={cn(
              "rounded-sm px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
              hubSide === "blue"
                ? "bg-alliance-blue text-primary-foreground glow-blue"
                : "border border-border bg-secondary text-secondary-foreground"
            )}
          >
            Blue Alliance
          </button>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          This selects which physical hub side this Pi is controlling (match.hub_side).
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Match Timing (2026 Official)
        </h3>
        <div className="grid grid-cols-3 gap-3 font-mono text-sm text-foreground">
          <div>
            AUTO: <span className="text-frc-yellow">20s</span>
          </div>
          <div>
            Auto Grace: <span className="text-frc-yellow">3s</span>
          </div>
          <div>
            Transition: <span className="text-primary">10s</span>
          </div>
          <div>
            Shift 1-4: <span className="text-frc-green">25s each</span>
          </div>
          <div>
            Endgame: <span className="text-frc-orange">30s</span>
          </div>
          <div>
            Teleop Grace: <span className="text-frc-orange">3s</span>
          </div>
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Total TELEOP: 2:20 · Total match: 2:43
        </p>
      </div>
    </div>
  );
}
