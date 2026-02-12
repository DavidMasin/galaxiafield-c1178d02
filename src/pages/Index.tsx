import ScorePanel from '@/components/match/ScorePanel';
import MatchTimer from '@/components/match/MatchTimer';
import MatchControls from '@/components/match/MatchControls';
import ScoringLog from '@/components/match/ScoringLog';
import { useMatchStore } from '@/store/matchStore';
import { useMatchTimer } from '@/hooks/useMatchTimer';

const Index = () => {
  useMatchTimer();
  const { redScore, blueScore, period, alliance, globalBallCount } = useMatchStore();

  const isActive = period !== 'disabled' && period !== 'finished';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
          Match Control
        </h1>
        <span className="font-mono text-sm text-muted-foreground">
          BALLS: {globalBallCount}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <ScorePanel alliance="red" score={redScore} isActive={isActive} />
        <MatchTimer />
        <ScorePanel alliance="blue" score={blueScore} isActive={isActive} />
      </div>

      <MatchControls />
      <ScoringLog />
    </div>
  );
};

export default Index;
