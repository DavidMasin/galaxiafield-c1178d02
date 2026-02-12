import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alliance } from '@/store/matchStore';

interface ScorePanelProps {
  alliance: Alliance;
  score: number;
  isActive?: boolean;
}

export default function ScorePanel({ alliance, score, isActive }: ScorePanelProps) {
  const isRed = alliance === 'red';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-all',
        isRed
          ? 'border-alliance-red/50 bg-alliance-red/10'
          : 'border-alliance-blue/50 bg-alliance-blue/10',
        isActive && (isRed ? 'glow-red' : 'glow-blue')
      )}
    >
      {/* Alliance label */}
      <span
        className={cn(
          'font-display text-xs font-bold uppercase tracking-[0.3em]',
          isRed ? 'text-alliance-red' : 'text-alliance-blue'
        )}
      >
        {alliance}
      </span>

      {/* Score */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={score}
          initial={{ scale: 1.3, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'text-score text-7xl leading-none',
            isRed ? 'text-alliance-red' : 'text-alliance-blue'
          )}
        >
          {score}
        </motion.span>
      </AnimatePresence>

      {/* Balls label */}
      <span className="mt-1 font-mono text-xs text-muted-foreground">
        BALLS SCORED
      </span>
    </div>
  );
}
