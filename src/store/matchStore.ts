import { create } from "zustand";

export type MatchPeriod =
  | "disabled"
  | "auto"
  | "auto_grace"
  | "transition"
  | "shift1"
  | "shift2"
  | "shift3"
  | "shift4"
  | "endgame"
  | "teleop_grace"
  | "finished";

export type Alliance = "red" | "blue";
export type HubStatus = "active" | "inactive" | "warning";

export type LedMode =
  | "off"
  | "solid_red"
  | "solid_blue"
  | "pulse_red"
  | "pulse_blue"
  | "chase_red"
  | "chase_blue"
  | "green"
  | "purple"
  | "idle";

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export interface ScoringEvent {
  id: string;
  timestamp: number; // ms
  exit: number;      // 1..4
  count: number;     // global count
  sensorId?: number; // legacy alias
  alliance?: Alliance; // optional
}

type PiStatusMsg = {
  type: "status";
  ts: number;
  estop_ok: boolean;
  ball_count: number;
  motor_enabled?: boolean;
  match: {
    running: boolean;
    paused: boolean;
    period: string; // prematch/postmatch/auto/shift1...
    match_time_left: number | null;
    time_left_in_period: number | null;
    hub_active: boolean;
    warn_deactivate: boolean;
    led_mode: string; // off/solid/pulse/chase/green/purple
    led_alliance: Alliance; // "red"|"blue" (hub_side)
    auto_winner: Alliance | null;
    hub_side: Alliance;
    force_mode: "force_active" | "force_inactive" | null;
    field_safe: "green" | "purple" | null;
  };
};

type PiScoreMsg = {
  type: "score";
  count: number;
  exit: number;
  ts: number; // unix seconds
};

declare global {
  interface Window {
    __PI_SEND__?: (msg: Record<string, unknown>) => void;
  }
}

function piSend(msg: Record<string, unknown>) {
  window.__PI_SEND__?.(msg);
}

function mapPiPeriod(pi: string): MatchPeriod {
  if (pi === "prematch") return "disabled";
  if (pi === "postmatch") return "finished";
  if (pi === "post_grace") return "teleop_grace";
  if (
    pi === "auto" ||
    pi === "auto_grace" ||
    pi === "transition" ||
    pi === "shift1" ||
    pi === "shift2" ||
    pi === "shift3" ||
    pi === "shift4" ||
    pi === "endgame" ||
    pi === "teleop_grace"
  ) return pi as MatchPeriod;
  return "disabled";
}

function mapPiLed(piLed: string, hubSide: Alliance): LedMode {
  if (piLed === "green") return "green";
  if (piLed === "purple") return "purple";
  if (piLed === "off") return "off";
  if (piLed === "solid") return hubSide === "red" ? "solid_red" : "solid_blue";
  if (piLed === "pulse") return hubSide === "red" ? "pulse_red" : "pulse_blue";
  if (piLed === "chase") return hubSide === "red" ? "chase_red" : "chase_blue";
  return "idle";
}

/**
 * Compute which alliance is ACTIVE during a shift.
 * Matches the Pi logic:
 * - If auto_winner == red => shift1 blue active, shift2 red, shift3 blue, shift4 red
 * - If auto_winner == blue => shift1 red active, shift2 blue, shift3 red, shift4 blue
 */
function activeAllianceForShift(autoWinner: Alliance, shift: "shift1" | "shift2" | "shift3" | "shift4"): Alliance {
  if (autoWinner === "red") {
    return (shift === "shift1" || shift === "shift3") ? "blue" : "red";
  }
  // autoWinner === "blue"
  return (shift === "shift1" || shift === "shift3") ? "red" : "blue";
}

function computeHubStatuses(match: PiStatusMsg["match"]): { red: HubStatus; blue: HubStatus } {
  const period = mapPiPeriod(match.period);

  // prematch/finished -> both inactive
  if (!match.running || period === "disabled" || period === "finished") {
    return { red: "inactive", blue: "inactive" };
  }

  // during these: both active
  if (period === "auto" || period === "auto_grace" || period === "transition" || period === "endgame" || period === "teleop_grace") {
    return { red: "active", blue: "active" };
  }

  // shifts: only one active
  if (period === "shift1" || period === "shift2" || period === "shift3" || period === "shift4") {
    const winner = match.auto_winner ?? "red";
    const active = activeAllianceForShift(winner, period);
    let red: HubStatus = active === "red" ? "active" : "inactive";
    let blue: HubStatus = active === "blue" ? "active" : "inactive";

    // warning 3s before boundary IF currently active will become inactive next shift
    const tLeft = typeof match.time_left_in_period === "number" ? match.time_left_in_period : 9999;
    if (tLeft <= 3) {
      const next =
        period === "shift1" ? "shift2" :
        period === "shift2" ? "shift3" :
        period === "shift3" ? "shift4" : "endgame";

      if (next.startsWith("shift")) {
        const nextActive = activeAllianceForShift(winner, next as any);
        if (nextActive !== active) {
          if (red === "active") red = "warning";
          if (blue === "active") blue = "warning";
        }
      }
    }
    return { red, blue };
  }

  // default safe
  return { red: "inactive", blue: "inactive" };
}

export interface MatchStore {
  period: MatchPeriod;
  timeRemaining: number;
  paused: boolean;

  redHubStatus: HubStatus;
  blueHubStatus: HubStatus;

  globalBallCount: number;
  scoringEvents: ScoringEvent[];

  estopOk: boolean;
  connectionStatus: ConnectionStatus;

  // Display what the Pi says the LEDs should be doing
  ledMode: LedMode;
  hubSide: Alliance;

  // keep raw for debugging if needed
  piMatch: PiStatusMsg["match"] | null;

  // Apply from WS
  applyPiStatus: (msg: PiStatusMsg) => void;
  applyPiScore: (msg: PiScoreMsg) => void;

  // Controls used by UI
  startMatch: () => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  stopMatch: () => void;

  setAutoWinner: (w: "red" | "blue" | "tie") => void;
  setHubSide: (a: Alliance) => void;
  force: (mode: null | "force_active" | "force_inactive") => void;
  fieldSafe: (mode: null | "green" | "purple") => void;

  resetCount: () => void;

  setConnectionStatus: (s: ConnectionStatus) => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  period: "disabled",
  timeRemaining: 0,
  paused: false,

  redHubStatus: "inactive",
  blueHubStatus: "inactive",

  globalBallCount: 0,
  scoringEvents: [],

  estopOk: true,
  connectionStatus: "disconnected",

  ledMode: "off",
  hubSide: "red",

  piMatch: null,

  applyPiStatus: (msg) => {
    const m = msg.match;
    const period = mapPiPeriod(m.period);
    const matchLeft = typeof m.match_time_left === "number" ? Math.max(0, m.match_time_left) : 0;

    const hubs = computeHubStatuses(m);

    set({
      piMatch: m,
      estopOk: msg.estop_ok,
      period,
      paused: !!m.paused,
      timeRemaining: Math.ceil(matchLeft),

      redHubStatus: hubs.red,
      blueHubStatus: hubs.blue,

      hubSide: m.hub_side,
      ledMode: mapPiLed(m.led_mode, m.hub_side),

      globalBallCount: msg.ball_count ?? get().globalBallCount,
    });
  },

  applyPiScore: (msg) => {
    const tsMs = Math.round(msg.ts * 1000);
    const ev: ScoringEvent = {
      id: `${tsMs}-${msg.count}-${msg.exit}`,
      timestamp: tsMs,
      exit: msg.exit,
      sensorId: msg.exit,
      count: msg.count,
    };

    set((st) => ({
      globalBallCount: msg.count,
      scoringEvents: [ev, ...st.scoringEvents].slice(0, 200),
    }));
  },

  startMatch: () => piSend({ type: "match_start" }),
  pauseMatch: () => piSend({ type: "match_pause" }),
  resumeMatch: () => piSend({ type: "match_resume" }),
  stopMatch: () => piSend({ type: "match_stop" }),

  setAutoWinner: (winner) => piSend({ type: "set_auto_winner", winner }),
  setHubSide: (alliance) => piSend({ type: "set_hub_side", alliance }),
  force: (mode) => piSend({ type: "force", mode }),
  fieldSafe: (mode) => piSend({ type: "field_safe", mode }),

  resetCount: () => piSend({ type: "reset_count" }),

  setConnectionStatus: (s) => set({ connectionStatus: s }),
}));
