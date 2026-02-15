import { useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { useMatchStore } from "@/store/matchStore";

/**
 * Tracks BPS (balls per second), fires confetti at milestones,
 * and shows "10+ BPS!!!" flash when scoring rate is insane.
 */
export function useMatchEffects() {
  const globalBallCount = useMatchStore((s) => s.globalBallCount);
  const prevCount = useRef(globalBallCount);
  const timestamps = useRef<number[]>([]); // recent score timestamps
  const fired100 = useRef(false);
  const fired360 = useRef(false);
  const bpsFlashUntil = useRef(0);

  // Reset milestone flags when count resets
  useEffect(() => {
    if (globalBallCount < prevCount.current) {
      fired100.current = false;
      fired360.current = false;
    }
  }, [globalBallCount]);

  // Track timestamps and fire effects
  useEffect(() => {
    const diff = globalBallCount - prevCount.current;
    prevCount.current = globalBallCount;

    if (diff <= 0) return;

    const now = Date.now();
    for (let i = 0; i < diff; i++) {
      timestamps.current.push(now);
    }
    // Keep only last 2 seconds of timestamps
    timestamps.current = timestamps.current.filter((t) => now - t < 2000);

    // Confetti at 100
    if (globalBallCount >= 100 && !fired100.current) {
      fired100.current = true;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    // BIG confetti at 360
    if (globalBallCount >= 360 && !fired360.current) {
      fired360.current = true;
      // Fire multiple bursts
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        confetti({
          particleCount: 100,
          startVelocity: 30,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() * 0.4 },
        });
        if (Date.now() > end) clearInterval(interval);
      }, 150);
    }

    // 10+ BPS flash
    const bps = computeBps(timestamps.current);
    if (bps >= 10) {
      bpsFlashUntil.current = now + 2000;
    }
  }, [globalBallCount]);

  const getBps = useCallback(() => {
    return computeBps(timestamps.current);
  }, []);

  const isBpsFlash = useCallback(() => {
    return Date.now() < bpsFlashUntil.current;
  }, []);

  return { getBps, isBpsFlash };
}

function computeBps(timestamps: number[]): number {
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t < 1000);
  return recent.length;
}
