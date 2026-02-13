import { useEffect, useRef } from "react";
import { useMatchStore } from "@/store/matchStore";

export function useMatchTimer() {
  const tickRef = useRef<number | null>(null);
  const { period, paused, tick, usePiClock } = useMatchStore();

  useEffect(() => {
    // If Pi clock is active, do NOT run local tick
    if (usePiClock) return;

    if (period !== "disabled" && period !== "finished" && !paused) {
      tickRef.current = window.setInterval(tick, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [period, paused, tick, usePiClock]);
}
