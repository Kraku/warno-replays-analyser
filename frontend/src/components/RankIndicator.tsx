import React from 'react';
import { Player } from '../parsers/playersParser';

type RankIndicatorProps = {
  player: Player;
  rankMinMax: {
    min: number | null;
    max: number | null;
  };
};

export const RankIndicator: React.FC<RankIndicatorProps> = ({ player, rankMinMax }) => {
  const rankMin = player.lastKnownRank ?? rankMinMax.min;
  const rankMax = player.lastKnownRank ?? rankMinMax.max;

  if (!rankMin) return null;

  const getRankColor = (rank: number) => {
    if (rank <= 50) return 'bg-rose-600';
    if (rank <= 100) return 'bg-orange-600';
    if (rank <= 200) return 'bg-yellow-600';
    if (rank <= 500) return 'bg-emerald-600';

    return 'bg-neutral-600';
  };

  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-1 ${getRankColor(rankMin)}`} />
      {rankMin === rankMax ? `${rankMin}` : `${rankMin} - ${rankMax}`}
    </div>
  );
};
