import { create } from 'zustand';

// ── 2026 FRC Match Periods ──
export type MatchPeriod =
  | 'disabled'
  | 'auto'
  | 'auto_grace'
  | 'transition'
  | 'shift1'
  | 'shift2'
  | 'shift3'
  | 'shift4'
  | 'endgame'
  | 'teleop_grace'
  | 'finished';

export type Alliance = 'red' | 'blue';

export type HubStatus = 'active' | 'inactive' | 'warning'; // warning = 3s before deactivation

export type LedMode =
  | 'off'
  | 'solid_red'
  | 'solid_blue'
  | 'pulse_red'
  | 'pulse_blue'
  | 'chase_red'
  | 'chase_blue'
  | 'green'
  | 'purple'
  | 'idle';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export type AutoWinner = 'red' | 'blue' | 'tie';

export interface ScoringEvent {
  id: string;
  alliance: Alliance;
  timestamp: number;
  sensorId: number;
  period: MatchPeriod;
}

export interface MotorState {
  enabled: boolean;
  percent: number;
  eStop: boolean;
}

// Period durations in seconds
export const PERIOD_DURATIONS: Record<string, number> = {
  auto: 20,
  auto_grace: 3,
  transition: 10,
  shift1: 25,
  shift2: 25,
  shift3: 25,
  shift4: 25,
  endgame: 30,
  teleop_grace: 3,
};

// The sequence of periods in a match
export const PERIOD_SEQUENCE: MatchPeriod[] = [
  'auto',
  'auto_grace',
  'transition',
  'shift1',
  'shift2',
  'shift3',
  'shift4',
  'endgame',
  'teleop_grace',
];

export const PERIOD_LABELS: Record<MatchPeriod, string> = {
  disabled: 'DISABLED',
  auto: 'AUTONOMOUS',
  auto_grace: 'AUTO GRACE',
  transition: 'TRANSITION SHIFT',
  shift1: 'SHIFT 1',
  shift2: 'SHIFT 2',
  shift3: 'SHIFT 3',
  shift4: 'SHIFT 4',
  endgame: 'END GAME',
  teleop_grace: 'TELEOP GRACE',
  finished: 'MATCH OVER',
};

export interface MatchStore {
  // Match state
  period: MatchPeriod;
  timeRemaining: number;
  totalMatchTime: number; // total elapsed
  paused: boolean;

  // Hub status
  redHubStatus: HubStatus;
  blueHubStatus: HubStatus;
  redHubOverride: 'none' | 'force_active' | 'force_inactive';
  blueHubOverride: 'none' | 'force_active' | 'force_inactive';

  // Auto winner (determines shift order)
  autoWinner: AutoWinner | null;
  autoWinnerLocked: boolean; // locked after auto ends
  shiftInactiveFirst: Alliance | null; // which alliance is inactive in shift1

  // Scores
  redScore: number;
  blueScore: number;
  redAutoScore: number;
  blueAutoScore: number;
  globalBallCount: number;
  scoringEvents: ScoringEvent[];

  // System
  connectionStatus: ConnectionStatus;
  ledMode: LedMode;
  motor: MotorState;
  alliance: Alliance; // current alliance color theme

  // Actions
  startMatch: () => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  resetMatch: () => void;
  tick: () => void;
  addScore: (count: number, timestamp: number) => void;
  setAutoWinner: (winner: AutoWinner) => void;
  setRedHubOverride: (o: 'none' | 'force_active' | 'force_inactive') => void;
  setBlueHubOverride: (o: 'none' | 'force_active' | 'force_inactive') => void;
  setAlliance: (a: Alliance) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setMotor: (updates: Partial<MotorState>) => void;
  triggerEStop: () => void;
  setGlobalBallCount: (count: number) => void;
  setPeriod: (p: MatchPeriod) => void;
  setMatchData: (data: any) => set({ matchData: data }),

}

function computeHubStatuses(
  period: MatchPeriod,
  timeRemaining: number,
  shiftInactiveFirst: Alliance | null,
  redOverride: 'none' | 'force_active' | 'force_inactive',
  blueOverride: 'none' | 'force_active' | 'force_inactive'
): { red: HubStatus; blue: HubStatus } {
  let red: HubStatus = 'active';
  let blue: HubStatus = 'active';

  // Determine natural hub status based on period
  if (period === 'auto' || period === 'auto_grace' || period === 'transition' || period === 'endgame' || period === 'teleop_grace') {
    red = 'active';
    blue = 'active';
  } else if (period === 'shift1' || period === 'shift2' || period === 'shift3' || period === 'shift4') {
    const shiftNum = parseInt(period.replace('shift', ''));
    const inactiveFirst = shiftInactiveFirst || 'red';
    // Odd shifts: inactiveFirst is inactive. Even shifts: the other is inactive.
    const isOddShift = shiftNum % 2 === 1;
    if (isOddShift) {
      if (inactiveFirst === 'red') { red = 'inactive'; blue = 'active'; }
      else { red = 'active'; blue = 'inactive'; }
    } else {
      if (inactiveFirst === 'red') { red = 'active'; blue = 'inactive'; }
      else { red = 'inactive'; blue = 'active'; }
    }

    // Warning: 3 seconds before deactivation (i.e., at end of current shift)
    if (timeRemaining <= 3) {
      // The alliance that is currently ACTIVE is about to become inactive
      if (red === 'active') red = 'warning';
      if (blue === 'active') blue = 'warning';
    }
  } else if (period === 'disabled' || period === 'finished') {
    red = 'inactive';
    blue = 'inactive';
  }

  // Also add warning before transition ends (both hubs about to have shift rules)
  if (period === 'transition' && timeRemaining <= 3) {
    const inactiveFirst = shiftInactiveFirst || 'red';
    if (inactiveFirst === 'red') red = 'warning';
    else blue = 'warning';
  }

  // Apply overrides
  if (redOverride === 'force_active') red = 'active';
  else if (redOverride === 'force_inactive') red = 'inactive';
  if (blueOverride === 'force_active') blue = 'active';
  else if (blueOverride === 'force_inactive') blue = 'inactive';

  return { red, blue };
}

function computeLedMode(period: MatchPeriod, redHub: HubStatus, blueHub: HubStatus, alliance: Alliance): LedMode {
  if (period === 'disabled') return 'off';
  if (period === 'finished') return 'purple';

  if (period === 'transition') {
    return alliance === 'red' ? 'chase_red' : 'chase_blue';
  }

  // During shifts / auto / endgame
  if (redHub === 'warning' || blueHub === 'warning') {
    return alliance === 'red' ? 'pulse_red' : 'pulse_blue';
  }

  const myHub = alliance === 'red' ? redHub : blueHub;
  if (myHub === 'active') return alliance === 'red' ? 'solid_red' : 'solid_blue';
  if (myHub === 'inactive') return 'off';

  return 'idle';
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  period: 'disabled',
  timeRemaining: 0,
  totalMatchTime: 0,
  paused: false,

  redHubStatus: 'inactive',
  blueHubStatus: 'inactive',
  redHubOverride: 'none',
  blueHubOverride: 'none',

  autoWinner: null,
  autoWinnerLocked: false,
  shiftInactiveFirst: null,

  redScore: 0,
  blueScore: 0,
  redAutoScore: 0,
  blueAutoScore: 0,
  globalBallCount: 0,
  scoringEvents: [],

  connectionStatus: 'disconnected',
  ledMode: 'off',
  motor: { enabled: false, percent: 0, eStop: false },
  alliance: 'red',

  startMatch: () => {
    const state = get();
    const winner = state.autoWinner;
    set({
      period: 'auto',
      timeRemaining: PERIOD_DURATIONS.auto,
      totalMatchTime: 0,
      paused: false,
      redScore: 0,
      blueScore: 0,
      redAutoScore: 0,
      blueAutoScore: 0,
      globalBallCount: 0,
      scoringEvents: [],
      autoWinnerLocked: false,
      shiftInactiveFirst: null,
    });
    // Compute initial hub statuses
    const hubs = computeHubStatuses('auto', PERIOD_DURATIONS.auto, null, 'none', 'none');
    const led = computeLedMode('auto', hubs.red, hubs.blue, state.alliance);
    set({ redHubStatus: hubs.red, blueHubStatus: hubs.blue, ledMode: led });
  },

  pauseMatch: () => set({ paused: true }),
  resumeMatch: () => set({ paused: false }),

  resetMatch: () => {
    set({
      period: 'disabled',
      timeRemaining: 0,
      totalMatchTime: 0,
      paused: false,
      redScore: 0,
      blueScore: 0,
      redAutoScore: 0,
      blueAutoScore: 0,
      globalBallCount: 0,
      scoringEvents: [],
      autoWinner: null,
      autoWinnerLocked: false,
      shiftInactiveFirst: null,
      redHubStatus: 'inactive',
      blueHubStatus: 'inactive',
      redHubOverride: 'none',
      blueHubOverride: 'none',
      ledMode: 'off',
      motor: { enabled: false, percent: 0, eStop: false },
    });
  },

  tick: () => {
    const state = get();
    if (state.period === 'disabled' || state.period === 'finished' || state.paused) return;

    const newTime = state.timeRemaining - 1;

    if (newTime <= 0) {
      // Advance to next period
      const idx = PERIOD_SEQUENCE.indexOf(state.period);

      // Lock auto winner when auto ends
      if (state.period === 'auto') {
        let winner = state.autoWinner;
        let inactiveFirst: Alliance;
        if (!winner) {
          // Determine from scores
          if (state.redAutoScore > state.blueAutoScore) winner = 'red';
          else if (state.blueAutoScore > state.redAutoScore) winner = 'blue';
          else winner = 'tie';
        }
        if (winner === 'red') inactiveFirst = 'red';
        else if (winner === 'blue') inactiveFirst = 'blue';
        else inactiveFirst = Math.random() > 0.5 ? 'red' : 'blue';

        set({ autoWinner: winner, autoWinnerLocked: true, shiftInactiveFirst: inactiveFirst });
      }

      if (idx < PERIOD_SEQUENCE.length - 1) {
        const nextPeriod = PERIOD_SEQUENCE[idx + 1];
        const nextDuration = PERIOD_DURATIONS[nextPeriod] || 0;
        const updatedState = get(); // re-get after auto winner set
        const hubs = computeHubStatuses(
          nextPeriod, nextDuration,
          updatedState.shiftInactiveFirst,
          updatedState.redHubOverride, updatedState.blueHubOverride
        );
        const led = computeLedMode(nextPeriod, hubs.red, hubs.blue, updatedState.alliance);
        set({
          period: nextPeriod,
          timeRemaining: nextDuration,
          totalMatchTime: state.totalMatchTime + 1,
          redHubStatus: hubs.red,
          blueHubStatus: hubs.blue,
          ledMode: led,
        });
      } else {
        // Match finished
        set({
          period: 'finished',
          timeRemaining: 0,
          totalMatchTime: state.totalMatchTime + 1,
          redHubStatus: 'inactive',
          blueHubStatus: 'inactive',
          ledMode: 'purple',
        });
      }
    } else {
      // Normal tick
      const hubs = computeHubStatuses(
        state.period, newTime,
        state.shiftInactiveFirst,
        state.redHubOverride, state.blueHubOverride
      );
      const led = computeLedMode(state.period, hubs.red, hubs.blue, state.alliance);
      set({
        timeRemaining: newTime,
        totalMatchTime: state.totalMatchTime + 1,
        redHubStatus: hubs.red,
        blueHubStatus: hubs.blue,
        ledMode: led,
      });
    }
  },

  addScore: (count: number, timestamp: number) => {
    const state = get();
    // Determine which alliance scores based on hub status
    // In a real system, the Pi sends the score; we attribute to the active alliance
    const event: ScoringEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      alliance: state.alliance,
      timestamp,
      sensorId: 0,
      period: state.period,
    };

    const isAutoScoring = state.period === 'auto' || state.period === 'auto_grace';
    set({
      globalBallCount: count,
      [`${state.alliance}Score`]: state[`${state.alliance}Score`] + 1,
      ...(isAutoScoring ? { [`${state.alliance}AutoScore`]: state[`${state.alliance}AutoScore`] + 1 } : {}),
      scoringEvents: [event, ...state.scoringEvents].slice(0, 100),
    } as any);
  },

  setAutoWinner: (winner) => {
    if (get().autoWinnerLocked) return;
    let inactiveFirst: Alliance;
    if (winner === 'red') inactiveFirst = 'red';
    else if (winner === 'blue') inactiveFirst = 'blue';
    else inactiveFirst = Math.random() > 0.5 ? 'red' : 'blue';
    set({ autoWinner: winner, shiftInactiveFirst: inactiveFirst });
  },

  setRedHubOverride: (o) => {
    set({ redHubOverride: o });
    // Recompute
    const s = get();
    const hubs = computeHubStatuses(s.period, s.timeRemaining, s.shiftInactiveFirst, o, s.blueHubOverride);
    set({ redHubStatus: hubs.red, blueHubStatus: hubs.blue });
  },

  setBlueHubOverride: (o) => {
    set({ blueHubOverride: o });
    const s = get();
    const hubs = computeHubStatuses(s.period, s.timeRemaining, s.shiftInactiveFirst, s.redHubOverride, o);
    set({ redHubStatus: hubs.red, blueHubStatus: hubs.blue });
  },

  setAlliance: (a) => set({ alliance: a }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setMotor: (updates) => set((s) => ({ motor: { ...s.motor, ...updates } })),
  triggerEStop: () => set((s) => ({
    motor: { ...s.motor, eStop: true, enabled: false, percent: 0 },
  })),
  setGlobalBallCount: (count) => set({ globalBallCount: count }),
  setPeriod: (p) => {
    const duration = PERIOD_DURATIONS[p] || 0;
    set({ period: p, timeRemaining: duration });
  },
}));
