import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '@/store/matchStore';
import { useSimulation } from '@/hooks/useSimulation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const phaseLabels = {
  disabled: 'DISABLED',
  auto: 'AUTONOMOUS',
  teleop: 'TELEOPERATED',
  endgame: 'ENDGAME',
  finished: 'MATCH OVER',
} as const;

const phaseColors = {
  disabled: 'text-muted-foreground',
  auto: 'text-frc-yellow',
  teleop: 'text-frc-green',
  endgame: 'text-frc-orange',
  finished: 'text-muted-foreground',
} as const;

export default function FullScreenMatch() {
  useSimulation();
  const navigate = useNavigate();
  const { phase, timeRemaining, redScore, blueScore, startMatch, setPhase, resetMatch } =
    useMatchStore();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = phase === 'endgame' && timeRemaining <= 10;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          navigate('/');
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (phase === 'disabled') startMatch();
          else if (phase === 'auto') setPhase('teleop');
          else if (phase === 'teleop') setPhase('endgame');
          else if (phase === 'endgame') setPhase('finished');
          else if (phase === 'finished') resetMatch();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, navigate, startMatch, setPhase, resetMatch]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background scanline select-none">
      {/* Phase */}
      <span
        className={cn(
          'font-display text-2xl font-bold uppercase tracking-[0.4em]',
          phaseColors[phase]
        )}
      >
        {phaseLabels[phase]}
      </span>

      {/* Timer */}
      <span
        className={cn(
          'mt-4 font-mono text-[12rem] font-bold leading-none tabular-nums tracking-wider',
          phaseColors[phase],
          isUrgent && 'animate-pulse-glow text-destructive'
        )}
      >
        {phase === 'disabled' || phase === 'finished' ? '--:--' : timeStr}
      </span>

      {/* Scores */}
      <div className="mt-12 flex gap-24">
        <div className="flex flex-col items-center">
          <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-alliance-red">
            Red
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={redScore}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-score text-[8rem] leading-none text-alliance-red"
            >
              {redScore}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-alliance-blue">
            Blue
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={blueScore}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-score text-[8rem] leading-none text-alliance-blue"
            >
              {blueScore}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Instructions */}
      <p className="mt-16 font-mono text-xs text-muted-foreground">
        SPACE to advance · ESC to exit
      </p>
    </div>
  );
}
