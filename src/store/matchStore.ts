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
    period: string; // pi uses "prematch","postmatch","post_grace" etc.
    match_time_left: number | null;
    time_left_in_period: number | null;
    hub_active: boolean;
    warn_deactivate: boolean;
    led_mode: string; // "off"|"solid"|"pulse"|"chase"|"green"|"purple"
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
  ts: number;
};

function mapPiPeriodToUi(piPeriod: string): MatchPeriod {
  // Pi: prematch/postmatch/post_grace
  if (piPeriod === "prematch") return "disabled";
  if (piPeriod === "postmatch") return "finished";
  if (piPeriod === "post_grace") return "teleop_grace";

  // Normal ones already match:
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

function mapPiLedToUi(piLedMode: string, ledAlliance: "red" | "blue"): LedMode {
  if (piLedMode === "green") return "green";
  if (piLedMode === "purple") return "purple";
  if (piLedMode === "off") return "off";

  if (piLedMode === "solid") return ledAlliance === "red" ? "solid_red" : "solid_blue";
  if (piLedMode === "pulse") return ledAlliance === "red" ? "pulse_red" : "pulse_blue";
  if (piLedMode === "chase") return ledAlliance === "red" ? "chase_red" : "chase_blue";

  return "idle";
}

function computeHubStatusesFromPi(match: PiStatusMsg["match"]): { red: HubStatus; blue: HubStatus } {
  const period = mapPiPeriodToUi(match.period);
  const tLeft = typeof match.time_left_in_period === "number" ? match.time_left_in_period : 9999;

  // Default: both active in non-shifts
  let red: HubStatus = "active";
  let blue: HubStatus = "active";

  if (period === "disabled" || period === "finished") {
    red = "inactive";
    blue = "inactive";
    return { red, blue };
  }

  if (period === "shift1" || period === "shift2" || period === "shift3" || period === "shift4") {
    const winner = match.auto_winner ?? "red";

    // This matches your Pi logic: shift1 inactive = auto winner
    // therefore shift1 active is opposite of winner.
    // Then alternates each shift.
    const activeByIfWinnerRed: Record<string, Alliance> = {
      shift1: "blue",
      shift2: "red",
      shift3: "blue",
      shift4: "red",
    };
    const activeByIfWinnerBlue: Record<string, Alliance> = {
      shift1: "red",
      shift2: "blue",
      shift3: "red",
      shift4: "blue",
    };

    const activeAlliance =
      winner === "red" ? activeByIfWinnerRed[period] : activeByIfWinnerBlue[period];

    red = activeAlliance === "red" ? "active" : "inactive";
    blue = activeAlliance === "blue" ? "active" : "inactive";

    // warning 3s before deactivation: whichever is active *and will become inactive next*
    if (tLeft <= 3.0) {
      // who is active next shift?
      const next =
        period === "shift4"
          ? "endgame"
          : (`shift${parseInt(period.replace("shift", "")) + 1}` as MatchPeriod);

      if (next.startsWith("shift")) {
        const nextActive =
          winner === "red"
            ? activeByIfWinnerRed[next]
            : activeByIfWinnerBlue[next];

        // if current active != nextActive then current active will deactivate
        if (activeAlliance !== nextActive) {
          if (red === "active") red = "warning";
          if (blue === "active") blue = "warning";
        }
      }
    }

    return { red, blue };
  }

  // auto/transition/endgame/teleop_grace: both active
  red = "active";
  blue = "active";

  // transition warning for shift1 inactive hub could be shown, but not required for “active/inactive”
  return { red, blue };
}

export interface MatchStore {
  // Pi-driven mode (default true)
  usePiClock: boolean;

  period: MatchPeriod;
  timeRemaining: number; // display (seconds)
  paused: boolean;

  // Hub state (computed from Pi match)
  redHubStatus: HubStatus;
  blueHubStatus: HubStatus;

  // Scores
  globalBallCount: number;

  // Pi match mirrors
  piMatch: PiStatusMsg["match"] | null;
  estopOk: boolean;

  // System
  connectionStatus: ConnectionStatus;
  ledMode: LedMode;
  alliance: Alliance;

  motor: MotorState;

  // Actions: apply messages
  applyPiStatus: (msg: PiStatusMsg) => void;
  applyPiScore: (msg: PiScoreMsg) => void;

  // Misc setters
  setAlliance: (a: Alliance) => void;
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

  piMatch: null,
  estopOk: true,

  connectionStatus: "disconnected",
  ledMode: "off",
  alliance: "red",

  motor: { enabled: false, percent: 0, eStop: false },

  applyPiStatus: (msg) => {
    const uiPeriod = mapPiPeriodToUi(msg.match.period);

    const matchLeft =
      typeof msg.match.match_time_left === "number"
        ? Math.max(0, msg.match.match_time_left)
        : 0;

    const led = mapPiLedToUi(msg.match.led_mode, msg.match.led_alliance);
    const hubs = computeHubStatusesFromPi(msg.match);

    set({
      piMatch: msg.match,
      estopOk: msg.estop_ok,

      period: uiPeriod,
      paused: !!msg.match.paused,

      // show whole-match time remaining (what you want on FMS)
      timeRemaining: Math.ceil(matchLeft),

      ledMode: led,
      redHubStatus: hubs.red,
      blueHubStatus: hubs.blue,

      globalBallCount: msg.ball_count ?? get().globalBallCount,

      motor: {
        ...get().motor,
        enabled: !!msg.motor_enabled,
        eStop: !msg.estop_ok,
      },
    });
  },

  applyPiScore: (msg) => {
    set({ globalBallCount: msg.count });
  },

  setAlliance: (a) => set({ alliance: a }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
}));
