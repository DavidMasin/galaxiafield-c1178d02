import { useEffect, useRef } from "react";
import { useMatchStore } from "@/store/matchStore";

export function useMatchTimer() {
  const tickRef = useRef<number | null>(null);
  const usePiClock = useMatchStore((s) => s.usePiClock);

  useEffect(() => {
    // Pi drives time; local ticking disabled.
    if (usePiClock) return;

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [usePiClock]);
}
