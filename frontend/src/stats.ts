import { Replay } from './parsers/replaysParser';

export type DivisionStats = {
  total: number;
  won: number;
};

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
    division: string;
    victoryRatio: number;
    games: number;
  }[];
  averageGameDuration: number;
  mostFrequentOpponents: {
    enemyDivision: string;
    count: number;
  }[];
  longestWinningStreak: number;
  longestLosingStreak: number;
  rankHistory: { date: string; rank: number }[];
  mapVictoryRatios: {
    map: string;
    victoryRatio: number;
    games: number;
  }[];
};

const calculateVictoryRatio = (won: number, total: number): number => {
  return total === 0 ? 0 : (won / total) * 100;
};

const getDivisionStats = (
  replays: Replay[],
  key: 'division' | 'enemyDivision'
): Record<string, DivisionStats> => {
  return replays.reduce((acc, replay) => {
    const divisionKey = replay[key];
    if (!divisionKey) return acc;

    if (!acc[divisionKey]) {
      acc[divisionKey] = { total: 0, won: 0 };
    }

    acc[divisionKey].total += 1;

    if (replay.result === 'Victory') {
      acc[divisionKey].won += 1;
    }

    return acc;
  }, {} as Record<string, DivisionStats>);
};

const calculateStreaks = (
  replays: Replay[]
): { longestWinningStreak: number; longestLosingStreak: number } => {
  let longestWinningStreak = 0;
  let longestLosingStreak = 0;
  let currentWinningStreak = 0;
  let currentLosingStreak = 0;

  replays.forEach((replay) => {
    if (replay.result === 'Victory') {
      currentWinningStreak += 1;
      currentLosingStreak = 0;
      longestWinningStreak = Math.max(longestWinningStreak, currentWinningStreak);
    } else {
      currentLosingStreak += 1;
      currentWinningStreak = 0;
      longestLosingStreak = Math.max(longestLosingStreak, currentLosingStreak);
    }
  });

  return { longestWinningStreak, longestLosingStreak };
};

const calculateMostFrequentOpponents = (
  replays: Replay[]
): { enemyDivision: string; count: number }[] => {
  const opponentFrequency: Record<string, number> = {};

  replays.forEach((replay) => {
    const enemyDivision = replay.enemyDivision;
    if (!enemyDivision) return;

    if (!opponentFrequency[enemyDivision]) {
      opponentFrequency[enemyDivision] = 0;
    }

    opponentFrequency[enemyDivision] += 1;
  });

  return Object.keys(opponentFrequency)
    .map((enemyDivision) => ({
      enemyDivision,
      count: opponentFrequency[enemyDivision]
    }))
    .sort((a, b) => b.count - a.count);
};

const calculateAverageGameDuration = (replays: Replay[]): number => {
  const totalDuration = replays.reduce((acc, replay) => acc + (replay.duration || 0), 0);
  return totalDuration / replays.length || 0;
};

const trackRankHistory = (replays: Replay[]): { date: string; rank: number }[] => {
  return replays
    .map((replay) => ({
      date: replay.createdAt,
      rank: parseInt(replay.rank)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getStats = (replays: Replay[]): Statistics => {
  const totalGames = replays.length;
  const wonGames = replays.filter((replay) => replay.result === 'Victory').length;
  const victoryRatio = calculateVictoryRatio(wonGames, totalGames);
  const divisionStats = getDivisionStats(replays, 'division');

  const divisionVictoryRatios = Object.keys(divisionStats)
    .map((division) => {
      const { total, won } = divisionStats[division];
      return {
        division,
        victoryRatio: calculateVictoryRatio(won, total),
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio);

  const enemyDivisionStats = getDivisionStats(replays, 'enemyDivision');
  const enemyDivisionVictoryRatios = Object.keys(enemyDivisionStats)
    .map((enemyDivision) => {
      const { total, won } = enemyDivisionStats[enemyDivision];
      return {
        division: enemyDivision,
        victoryRatio: calculateVictoryRatio(won, total),
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio);

  const { longestWinningStreak, longestLosingStreak } = calculateStreaks(replays);
  const mostFrequentOpponents = calculateMostFrequentOpponents(replays);
  const averageGameDuration = calculateAverageGameDuration(replays);
  const rankHistory = trackRankHistory(replays);
  const mapStats = replays.reduce((acc, replay) => {
    const map = replay.map;
    if (!map) return acc;

    if (!acc[map]) {
      acc[map] = { total: 0, won: 0 };
    }

    acc[map].total += 1;

    if (replay.result === 'Victory') {
      acc[map].won += 1;
    }

    return acc;
  }, {} as Record<string, DivisionStats>);

  const mapVictoryRatios = Object.keys(mapStats)
    .map((map) => {
      const { total, won } = mapStats[map];
      return {
        map,
        victoryRatio: calculateVictoryRatio(won, total),
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio);

  return {
    totalGames,
    wonGames,
    victoryRatio,
    divisionVictoryRatios,
    enemyDivisionVictoryRatios,
    averageGameDuration,
    mostFrequentOpponents,
    longestWinningStreak,
    longestLosingStreak,
    rankHistory,
    mapVictoryRatios
  };
};
