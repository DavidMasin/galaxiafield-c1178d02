import ScorePanel from '@/components/match/ScorePanel';
import MatchTimer from '@/components/match/MatchTimer';
import MatchControls from '@/components/match/MatchControls';
import ScoringLog from '@/components/match/ScoringLog';
import { useMatchStore } from '@/store/matchStore';
import { useSimulation } from '@/hooks/useSimulation';

const Index = () => {
  useSimulation();
  const { redScore, blueScore, phase, alliance, matchNumber } = useMatchStore();

  const isActive = phase !== 'disabled' && phase !== 'finished';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-bold uppercase tracking-[0.2em] text-foreground">
          Match Control
        </h1>
        <span className="font-mono text-sm text-muted-foreground">
          MATCH #{matchNumber}
        </span>
      </div>

      {/* Score + Timer row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <ScorePanel alliance="red" score={redScore} isActive={isActive && alliance === 'red'} />
        <MatchTimer />
        <ScorePanel alliance="blue" score={blueScore} isActive={isActive && alliance === 'blue'} />
      </div>

      {/* Controls */}
      <MatchControls />

      {/* Scoring Log */}
      <ScoringLog />
    </div>
  );
};

export default Index;
