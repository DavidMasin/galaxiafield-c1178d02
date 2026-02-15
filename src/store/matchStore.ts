import { create } from "zustand";

// ── 2026 FRC Match Periods ──
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
export type HubStatus = "active" | "inactive" | "warning"; // warning = 3s before deactivation

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

/** ✅ Required by MatchTimer.tsx and FullScreenMatch.tsx */
export const PERIOD_LABELS: Record<MatchPeriod, string> = {
  disabled: "PREMATCH",
  auto: "AUTO",
  auto_grace: "AUTO GRACE",
  transition: "TRANSITION",
  shift1: "SHIFT 1",
  shift2: "SHIFT 2",
  shift3: "SHIFT 3",
  shift4: "SHIFT 4",
  endgame: "ENDGAME",
  teleop_grace: "TELEOP GRACE",
  finished: "POSTMATCH",
};

export interface ScoringEvent {
  id: string;
  timestamp: number; // ms
  exit: number; // 1..4
  count: number; // global count
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
  // Store actions must never throw if WS bridge isn't ready yet.
  window.__PI_SEND__?.(msg);
}

function mapPiPeriod(pi: string | null | undefined): MatchPeriod {
  if (pi === "prematch") return "disabled";
  if (pi === "postmatch") return "finished";
  if (pi === "post_grace") return "teleop_grace";
  if (pi === "field_safe") return "disabled"; // manual override mode

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
  )
    return pi as MatchPeriod;

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
 * Which alliance is ACTIVE in a given shift, matching the Pi logic in match_logic.py.
 */
function activeAllianceForShift(
  autoWinner: Alliance,
  shift: "shift1" | "shift2" | "shift3" | "shift4"
): Alliance {
  // Pi defines SHIFT1 active alliance as the opposite of the AUTO winner.
  if (autoWinner === "red") {
    return shift === "shift1" || shift === "shift3" ? "blue" : "red";
  }
  return shift === "shift1" || shift === "shift3" ? "red" : "blue";
}

/**
 * Derive both-hub statuses for the dashboard.
 *
 * The Pi's `hub_active` / `warn_deactivate` describe ONLY the hub side that this Pi controls.
 * For the UI we still need red+blue indicators, so we replicate the SAME rules used on the Pi.
 *
 * Critical: manual overrides (field_safe / force_mode) must override match.running.
 */
function computeHubStatuses(match: PiStatusMsg["match"]): { red: HubStatus; blue: HubStatus } {
  const period = mapPiPeriod(match.period);

  // ----- Manual overrides from Pi (mirror 1:1) -----
  if (match.field_safe === "green" || match.field_safe === "purple") {
    return { red: "active", blue: "active" };
  }
  if (match.force_mode === "force_active") {
    return { red: "active", blue: "active" };
  }
  if (match.force_mode === "force_inactive") {
    return { red: "inactive", blue: "inactive" };
  }

  // ----- Normal prematch/postmatch -----
  if (!match.running || period === "disabled" || period === "finished") {
    return { red: "inactive", blue: "inactive" };
  }

  // both-active periods
  if (
    period === "auto" ||
    period === "auto_grace" ||
    period === "transition" ||
    period === "endgame" ||
    period === "teleop_grace"
  ) {
    return { red: "active", blue: "active" };
  }

  // shifts: only one active
  if (period === "shift1" || period === "shift2" || period === "shift3" || period === "shift4") {
    const winner = match.auto_winner ?? "red";
    const active = activeAllianceForShift(winner, period);

    let red: HubStatus = active === "red" ? "active" : "inactive";
    let blue: HubStatus = active === "blue" ? "active" : "inactive";

    // warning 3s before boundary if active will flip next shift
    const tLeft = typeof match.time_left_in_period === "number" ? match.time_left_in_period : 9999;
    if (tLeft <= 3) {
      const next =
        period === "shift1"
          ? "shift2"
          : period === "shift2"
          ? "shift3"
          : period === "shift3"
          ? "shift4"
          : "endgame";

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

  return { red: "inactive", blue: "inactive" };
}

export interface MotorState {
  enabled: boolean;
  percent: number;
  eStop: boolean;
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

  ledMode: LedMode;
  hubSide: Alliance;

  motor: MotorState;

  piMatch: PiStatusMsg["match"] | null;

  // Demo mode
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;

  applyPiStatus: (msg: PiStatusMsg) => void;
  applyPiScore: (msg: PiScoreMsg) => void;

  // Controls (legacy; prefer usePiWs().send in UI components)
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

  motor: { enabled: false, percent: 0, eStop: false },

  piMatch: null,

  demoMode: false,
  setDemoMode: (on) => set({ demoMode: on }),

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

      motor: {
        enabled: !!msg.motor_enabled,
        percent: 0,
        eStop: !msg.estop_ok,
      },

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
