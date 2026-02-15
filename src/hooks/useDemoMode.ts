import { useEffect, useRef } from "react";
import { useMatchStore } from "@/store/matchStore";

/**
 * Demo mode: simulates score events locally without WebSocket.
 * Randomly adds 1-3 balls every 200-800ms.
 */
export function useDemoMode() {
  const demoMode = useMatchStore((s) => s.demoMode);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!demoMode) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const tick = () => {
      const store = useMatchStore.getState();
      const add = Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1;
      const newCount = store.globalBallCount + add;

      // Simulate a score event
      store.applyPiScore({
        type: "score",
        count: newCount,
        exit: Math.ceil(Math.random() * 4),
        ts: Date.now() / 1000,
      });
    };

    const schedule = () => {
      const delay = 200 + Math.random() * 600;
      intervalRef.current = window.setTimeout(() => {
        tick();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [demoMode]);
}
