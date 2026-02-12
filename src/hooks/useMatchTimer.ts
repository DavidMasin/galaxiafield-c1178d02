import { useEffect, useRef } from 'react';
import { useMatchStore } from '@/store/matchStore';

export function useMatchTimer() {
  const tickRef = useRef<number | null>(null);
  const { period, paused, tick } = useMatchStore();

  useEffect(() => {
    if (period !== 'disabled' && period !== 'finished' && !paused) {
      tickRef.current = window.setInterval(tick, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [period, paused, tick]);
}
