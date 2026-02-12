import { useEffect, useRef } from 'react';
import { useMatchStore, type Alliance } from '@/store/matchStore';

export function useSimulation() {
  const {
    demoMode,
    phase,
    tick,
    addScore,
    alliance,
    simulationInterval,
    setSimulationInterval,
  } = useMatchStore();

  const tickRef = useRef<number | null>(null);

  // Match timer tick
  useEffect(() => {
    if (phase !== 'disabled' && phase !== 'finished') {
      tickRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, tick]);

  // Demo scoring simulation
  useEffect(() => {
    if (demoMode && phase !== 'disabled' && phase !== 'finished') {
      const id = window.setInterval(() => {
        const scoringAlliance: Alliance = Math.random() > 0.5 ? 'red' : 'blue';
        const sensorId = Math.floor(Math.random() * 4) + 1;
        addScore(scoringAlliance, sensorId);
      }, 2000 + Math.random() * 3000);

      setSimulationInterval(id);
      return () => clearInterval(id);
    } else {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
    }
  }, [demoMode, phase]);
}
