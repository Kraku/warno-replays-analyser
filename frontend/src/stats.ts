import { Replay } from './parser';

export type Statistics = {
  totalGames: number;
  wonGames: number;
  victoryRatio: number;
  divisionVictoryRatios: {
    division: string;
    victoryRatio: number;
    games: number;
  }[];
  enemyDivisionVictoryRatios: {
    enemyDivision: string;
    victoryRatio: number;
    games: number;
  }[];
};

export const getStats = (replays: Replay[]): Statistics => {
  const totalGames = replays.length;
  const wonGames = replays.filter((replay) => replay.result === 'Victory').length;
  const victoryRatio = (wonGames / totalGames) * 100;

  const divisionStats = replays.reduce((acc, replay) => {
    const division = replay.division;

    if (!acc[division]) {
      acc[division] = { total: 0, won: 0 };
    }

    acc[division].total += 1;

    if (replay.result === 'Victory') {
      acc[division].won += 1;
    }

    return acc;
  }, {} as Record<string, { total: number; won: number }>);

  const divisionVictoryRatios = Object.keys(divisionStats)
    .map((division) => {
      const { total, won } = divisionStats[division];

      return {
        division,
        victoryRatio: (won / total) * 100,
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio);

  const enemyDivisionStats = replays.reduce((acc, replay) => {
    const enemyDivision = replay.enemyDivision;

    if (!acc[enemyDivision]) {
      acc[enemyDivision] = { total: 0, won: 0 };
    }

    acc[enemyDivision].total += 1;

    if (replay.result === 'Victory') {
      acc[enemyDivision].won += 1;
    }

    return acc;
  }, {} as Record<string, { total: number; won: number }>);

  const enemyDivisionVictoryRatios = Object.keys(enemyDivisionStats)
    .map((enemyDivision) => {
      const { total, won } = enemyDivisionStats[enemyDivision];

      return {
        enemyDivision,
        victoryRatio: (won / total) * 100,
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio);

  return {
    totalGames,
    wonGames,
    victoryRatio,
    divisionVictoryRatios,
    enemyDivisionVictoryRatios
  };
};
