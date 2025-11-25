import React from 'react';

type RankIndicatorProps = {
  rankMinMax?: {
    min: number | null;
    max: number | null;
  };
  rank?: number;
  delta?: number;
};

export const RankIndicator: React.FC<RankIndicatorProps> = ({ rankMinMax, rank, delta }) => {
  // Prefer `rank` if available, otherwise use min/max
  const rankMin = rank ?? rankMinMax?.min;
  const rankMax = rank ?? rankMinMax?.max;

  if (!rankMin) return null;

  const getRankColor = (r: number) => {
    if (r <= 50) return 'bg-rose-600';
    if (r <= 100) return 'bg-orange-600';
    if (r <= 200) return 'bg-yellow-600';
    if (r <= 500) return 'bg-emerald-600';
    return 'bg-neutral-600';
  };

  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-1 ${getRankColor(rankMin)}`} />
      {rankMin === rankMax ? `${rankMin}` : `${rankMin} - ${rankMax}`}
      {delta ? <div className="text-neutral-500 ml-1">({delta})</div> : null}
    </div>
  );
};
