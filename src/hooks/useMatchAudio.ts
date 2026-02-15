import { useEffect, useRef, useCallback } from "react";
import { useMatchStore } from "@/store/matchStore";
import matchClockSrc from "@/assets/match-clock.mp3";

/**
 * Manages all match audio:
 * - Match clock audio (plays from start, pauses/resumes with match)
 * - Celebration sounds at 100 and 360 milestones
 */
export function useMatchAudio() {
  const period = useMatchStore((s) => s.period);
  const paused = useMatchStore((s) => s.paused);
  const globalBallCount = useMatchStore((s) => s.globalBallCount);

  const clockAudio = useRef<HTMLAudioElement | null>(null);
  const matchSoundEnabled = useRef(true);
  const celebrationSoundEnabled = useRef(true);
  const fired100Sound = useRef(false);
  const fired360Sound = useRef(false);
  const prevCount = useRef(globalBallCount);

  // Init clock audio once
  useEffect(() => {
    clockAudio.current = new Audio(matchClockSrc);
    clockAudio.current.volume = 0.7;
    return () => {
      clockAudio.current?.pause();
      clockAudio.current = null;
    };
  }, []);

  // Play/pause/stop clock based on match state
  useEffect(() => {
    const audio = clockAudio.current;
    if (!audio) return;

    if (period === "disabled" || period === "finished") {
      audio.pause();
      audio.currentTime = 0;
      // Reset milestone sounds when match resets
      fired100Sound.current = false;
      fired360Sound.current = false;
      return;
    }

    if (!matchSoundEnabled.current) {
      audio.pause();
      return;
    }

    if (paused) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [period, paused]);

  // Reset milestone flags when count resets
  useEffect(() => {
    if (globalBallCount < prevCount.current) {
      fired100Sound.current = false;
      fired360Sound.current = false;
    }
    prevCount.current = globalBallCount;
  }, [globalBallCount]);

  // Celebration sounds at milestones
  useEffect(() => {
    if (!celebrationSoundEnabled.current) return;

    if (globalBallCount >= 100 && !fired100Sound.current) {
      fired100Sound.current = true;
      playCelebrationTone(600, 0.3, 0.15);
      setTimeout(() => playCelebrationTone(800, 0.3, 0.15), 150);
      setTimeout(() => playCelebrationTone(1000, 0.4, 0.2), 300);
    }

    if (globalBallCount >= 360 && !fired360Sound.current) {
      fired360Sound.current = true;
      // Epic fanfare
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        setTimeout(() => playCelebrationTone(freq, 0.35, 0.25), i * 120);
      });
    }
  }, [globalBallCount]);

  const setMatchSound = useCallback((on: boolean) => {
    matchSoundEnabled.current = on;
    if (!on) {
      clockAudio.current?.pause();
    } else {
      const store = useMatchStore.getState();
      if (store.period !== "disabled" && store.period !== "finished" && !store.paused) {
        clockAudio.current?.play().catch(() => {});
      }
    }
  }, []);

  const setCelebrationSound = useCallback((on: boolean) => {
    celebrationSoundEnabled.current = on;
  }, []);

  const getMatchSoundEnabled = useCallback(() => matchSoundEnabled.current, []);
  const getCelebrationSoundEnabled = useCallback(() => celebrationSoundEnabled.current, []);

  return { setMatchSound, setCelebrationSound, getMatchSoundEnabled, getCelebrationSoundEnabled };
}

/** Generate a short synth tone via Web Audio API */
function playCelebrationTone(frequency: number, duration: number, volume: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // AudioContext may fail silently
  }
}
