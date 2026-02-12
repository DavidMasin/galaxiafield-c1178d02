import { create } from 'zustand';

export type MatchPhase = 'disabled' | 'auto' | 'teleop' | 'endgame' | 'finished';
export type Alliance = 'red' | 'blue';
export type LedMode = 'idle' | 'alliance_red' | 'alliance_blue' | 'scoring' | 'countdown' | 'endgame' | 'error';
export type ConnectionStatus = 'connected' | 'disconnected' | 'simulated';
export type SensorHealth = 'ok' | 'warn' | 'error' | 'offline';

export interface ScoringEvent {
  id: string;
  alliance: Alliance;
  timestamp: number;
  sensorId: number;
}

export interface SensorStatus {
  id: number;
  name: string;
  health: SensorHealth;
  lastTrigger: number | null;
}

export interface MotorState {
  enabled: boolean;
  rpm: number;
  targetRpm: number;
  currentDraw: number;
  safetyInterlock: boolean;
  eStop: boolean;
}

export interface MatchTimingConfig {
  autoDuration: number;
  teleopDuration: number;
  endgameDuration: number;
}

export interface MatchStore {
  // Match state
  phase: MatchPhase;
  timeRemaining: number;
  matchNumber: number;
  alliance: Alliance;

  // Scores
  redScore: number;
  blueScore: number;
  scoringEvents: ScoringEvent[];

  // System
  connectionStatus: ConnectionStatus;
  sensors: SensorStatus[];
  ledMode: LedMode;
  ledBrightness: number;
  motor: MotorState;

  // Settings
  demoMode: boolean;
  piAddress: string;
  piPort: number;
  timing: MatchTimingConfig;

  // Simulation
  simulationInterval: number | null;

  // Actions
  setPhase: (phase: MatchPhase) => void;
  startMatch: () => void;
  tick: () => void;
  addScore: (alliance: Alliance, sensorId: number) => void;
  resetMatch: () => void;
  setAlliance: (alliance: Alliance) => void;
  setLedMode: (mode: LedMode) => void;
  setLedBrightness: (brightness: number) => void;
  setMotor: (updates: Partial<MotorState>) => void;
  triggerEStop: () => void;
  setDemoMode: (enabled: boolean) => void;
  setPiAddress: (address: string) => void;
  setPiPort: (port: number) => void;
  setTiming: (timing: Partial<MatchTimingConfig>) => void;
  setSimulationInterval: (id: number | null) => void;
  setSensorHealth: (sensorId: number, health: SensorHealth) => void;
}

const defaultSensors: SensorStatus[] = [
  { id: 1, name: 'Beam Break A', health: 'ok', lastTrigger: null },
  { id: 2, name: 'Beam Break B', health: 'ok', lastTrigger: null },
  { id: 3, name: 'IR Sensor C', health: 'warn', lastTrigger: null },
  { id: 4, name: 'ToF Sensor D', health: 'ok', lastTrigger: null },
];

const defaultTiming: MatchTimingConfig = {
  autoDuration: 15,
  teleopDuration: 135,
  endgameDuration: 30,
};

export const useMatchStore = create<MatchStore>((set, get) => ({
  phase: 'disabled',
  timeRemaining: 0,
  matchNumber: 1,
  alliance: 'red',

  redScore: 0,
  blueScore: 0,
  scoringEvents: [],

  connectionStatus: 'simulated',
  sensors: defaultSensors,
  ledMode: 'idle',
  ledBrightness: 80,
  motor: {
    enabled: false,
    rpm: 0,
    targetRpm: 0,
    currentDraw: 0,
    safetyInterlock: true,
    eStop: false,
  },

  demoMode: true,
  piAddress: '192.168.1.100',
  piPort: 8765,
  timing: defaultTiming,
  simulationInterval: null,

  setPhase: (phase) => {
    const { timing } = get();
    let timeRemaining = 0;
    if (phase === 'auto') timeRemaining = timing.autoDuration;
    else if (phase === 'teleop') timeRemaining = timing.teleopDuration;
    else if (phase === 'endgame') timeRemaining = timing.endgameDuration;
    set({ phase, timeRemaining });
  },

  startMatch: () => {
    const { timing } = get();
    set({
      phase: 'auto',
      timeRemaining: timing.autoDuration,
      redScore: 0,
      blueScore: 0,
      scoringEvents: [],
    });
  },

  tick: () => {
    const { phase, timeRemaining, timing } = get();
    if (phase === 'disabled' || phase === 'finished') return;

    if (timeRemaining <= 0) {
      if (phase === 'auto') {
        set({ phase: 'teleop', timeRemaining: timing.teleopDuration });
      } else if (phase === 'teleop') {
        set({ phase: 'endgame', timeRemaining: timing.endgameDuration });
      } else if (phase === 'endgame') {
        set({ phase: 'finished', timeRemaining: 0 });
      }
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  addScore: (alliance, sensorId) => {
    const event: ScoringEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      alliance,
      timestamp: Date.now(),
      sensorId,
    };
    set((state) => ({
      [`${alliance}Score`]: state[`${alliance}Score`] + 1,
      scoringEvents: [event, ...state.scoringEvents].slice(0, 50),
      sensors: state.sensors.map((s) =>
        s.id === sensorId ? { ...s, lastTrigger: Date.now() } : s
      ),
    }));
  },

  resetMatch: () => {
    set({
      phase: 'disabled',
      timeRemaining: 0,
      redScore: 0,
      blueScore: 0,
      scoringEvents: [],
      ledMode: 'idle',
    });
  },

  setAlliance: (alliance) => set({ alliance }),
  setLedMode: (ledMode) => set({ ledMode }),
  setLedBrightness: (ledBrightness) => set({ ledBrightness }),
  setMotor: (updates) =>
    set((state) => ({ motor: { ...state.motor, ...updates } })),
  triggerEStop: () =>
    set((state) => ({
      motor: { ...state.motor, eStop: true, enabled: false, rpm: 0, targetRpm: 0 },
      phase: 'disabled',
    })),
  setDemoMode: (demoMode) =>
    set({ demoMode, connectionStatus: demoMode ? 'simulated' : 'disconnected' }),
  setPiAddress: (piAddress) => set({ piAddress }),
  setPiPort: (piPort) => set({ piPort }),
  setTiming: (updates) =>
    set((state) => ({ timing: { ...state.timing, ...updates } })),
  setSimulationInterval: (simulationInterval) => set({ simulationInterval }),
  setSensorHealth: (sensorId, health) =>
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === sensorId ? { ...s, health } : s
      ),
    })),
}));
