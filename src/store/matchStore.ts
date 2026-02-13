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
export type AutoWinner = "red" | "blue" | "tie";

export interface ScoringEvent {
  id: string;
  timestamp: number; // ms
  exit: number;      // 1..4
  count: number;     // global count
  alliance?: Alliance; // optional (Pi doesn't provide; UI may later)
  sensorId?: number;   // legacy name
}

export interface MotorState {
  enabled: boolean;
  percent: number;
  eStop: boolean;
}

export const PERIOD_LABELS: Record<MatchPeriod, string> = {
  disabled: "DISABLED",
  auto: "AUTONOMOUS",
  auto_grace: "AUTO GRACE",
  transition: "TRANSITION SHIFT",
  shift1: "SHIFT 1",
  shift2: "SHIFT 2",
  shift3: "SHIFT 3",
  shift4: "SHIFT 4",
  endgame: "END GAME",
  teleop_grace: "TELEOP GRACE",
  finished: "MATCH OVER",
};

type PiStatusMsg = {
  type: "status";
  ts: number;
  estop_ok: boolean;
  ball_count: number;
  motor_enabled?: boolean;
  match: {
    running: boolean;
    paused: boolean;
    period: string;
    match_time_left: number | null;
    time_left_in_period: number | null;
    hub_active: boolean;
    warn_deactivate: boolean;
    led_mode: string;
    led_alliance: "red" | "blue";
    auto_winner: "red" | "blue" | null;
    hub_side: "red" | "blue";
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
  // Safe no-op if provider not mounted yet
  window.__PI_SEND__?.(msg);
}

function mapPiPeriodToUi(piPeriod: string): MatchPeriod {
  if (piPeriod === "prematch") return "disabled";
  if (piPeriod === "postmatch") return "finished";
  if (piPeriod === "post_grace") return "teleop_grace";

  if (
    piPeriod === "auto" ||
    piPeriod === "auto_grace" ||
    piPeriod === "transition" ||
    piPeriod === "shift1" ||
    piPeriod === "shift2" ||
    piPeriod === "shift3" ||
    piPeriod === "shift4" ||
    piPeriod === "endgame" ||
    piPeriod === "teleop_grace"
  ) {
    return piPeriod as MatchPeriod;
  }
  return "disabled";
}

function mapPiLedToUi(piLedMode: string, ledAlliance: Alliance): LedMode {
  if (piLedMode === "green") return "green";
  if (piLedMode === "purple") return "purple";
  if (piLedMode === "off") return "off";

  if (piLedMode === "solid") return ledAlliance === "red" ? "solid_red" : "solid_blue";
  if (piLedMode === "pulse") return ledAlliance === "red" ? "pulse_red" : "pulse_blue";
  if (piLedMode === "chase") return ledAlliance === "red" ? "chase_red" : "chase_blue";

  return "idle";
}

export interface MatchStore {
  // Pi-driven state
  usePiClock: boolean;

  period: MatchPeriod;
  timeRemaining: number;
  paused: boolean;

  redHubStatus: HubStatus;
  blueHubStatus: HubStatus;

  globalBallCount: number;
  scoringEvents: ScoringEvent[];

  piMatch: PiStatusMsg["match"] | null;
  estopOk: boolean;

  connectionStatus: ConnectionStatus;
  ledMode: LedMode;

  motor: MotorState;

  // UI preferences / controls
  alliance: Alliance;

  // WS apply
  applyPiStatus: (msg: PiStatusMsg) => void;
  applyPiScore: (msg: PiScoreMsg) => void;

  // Compatibility actions (existing pages call these)
  setAlliance: (a: Alliance) => void;

  startMatch: () => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  resetMatch: () => void;
  resetCount: () => void;

  setConnectionStatus: (s: ConnectionStatus) => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  usePiClock: true,

  period: "disabled",
  timeRemaining: 0,
  paused: false,

  redHubStatus: "inactive",
  blueHubStatus: "inactive",

  globalBallCount: 0,
  scoringEvents: [],

  piMatch: null,
  estopOk: true,

  connectionStatus: "disconnected",
  ledMode: "off",

  motor: { enabled: false, percent: 0, eStop: false },

  alliance: "red",

  applyPiStatus: (msg) => {
    const uiPeriod = mapPiPeriodToUi(msg.match.period);

    const matchLeft =
      typeof msg.match.match_time_left === "number"
        ? Math.max(0, msg.match.match_time_left)
        : 0;

    set({
      piMatch: msg.match,
      estopOk: msg.estop_ok,

      period: uiPeriod,
      paused: !!msg.match.paused,
      timeRemaining: Math.ceil(matchLeft),

      ledMode: mapPiLedToUi(msg.match.led_mode, msg.match.led_alliance),

      globalBallCount: msg.ball_count ?? get().globalBallCount,

      motor: {
        ...get().motor,
        enabled: !!msg.motor_enabled,
        eStop: !msg.estop_ok,
      },
    });
  },

  applyPiScore: (msg) => {
    const tsMs = Math.round(msg.ts * 1000);
    const ev: ScoringEvent = {
      id: `${tsMs}-${msg.count}-${msg.exit}`,
      timestamp: tsMs,
      exit: msg.exit,
      sensorId: msg.exit, // legacy alias
      count: msg.count,
    };

    set((st) => ({
      globalBallCount: msg.count,
      scoringEvents: [ev, ...st.scoringEvents].slice(0, 200),
    }));
  },

  setAlliance: (a) => {
    const alliance: Alliance = a === "blue" ? "blue" : "red";
    set({ alliance });

    // This is the IMPORTANT part: selecting alliance on UI should control which hub side this Pi represents
    // (this lets “force active” etc affect the intended side)
    piSend({ type: "set_hub_side", alliance });
  },

  // Compatibility button actions → Pi commands
  startMatch: () => piSend({ type: "match_start" }),
  pauseMatch: () => piSend({ type: "match_pause" }),
  resumeMatch: () => piSend({ type: "match_resume" }),
  resetMatch: () => {
    piSend({ type: "match_stop" });
    piSend({ type: "reset_count" });
    piSend({ type: "force", mode: null });
    piSend({ type: "field_safe", mode: null });
  },
  resetCount: () => piSend({ type: "reset_count" }),

  setConnectionStatus: (s) => set({ connectionStatus: s }),
}));
