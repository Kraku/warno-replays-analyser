import { calculateWeightedWinRate } from './helpers/CalculatedWeightedWinrate';
import { calculateVictoryRatio } from './helpers/calculateVictoryRatio';
import { CommonReplayData, Replay1v1, Replay2v2 } from './parsers/replaysParser';
import { getPlayerIdCommonNameMap } from './parsers/teamsParser';

export type CommonStatistics = {
  totalGames: number;
  wonGames: number;
  victoryRatio: number;
  longestWinningStreak: number;
  longestLosingStreak: number;
  averageGameDuration: number;
  mapVictoryRatios: {
    map: string;
    victoryRatio: number;
    games: number;
  }[];
}

export type DivisionStats = {
  total: number;
  won: number;
};

export type Statistics1v1 = CommonStatistics & {
  rankHistory: { date: string; rank: number }[];
  enemyDivisionVictoryRatios: {
    division: string;
    victoryRatio: number;
    games: number;
  }[];
  divisionVictoryRatios: {
    division: string;
    victoryRatio: number;
    games: number;
  }[];
  mostFrequentOpponents: {
    enemyDivision: string;
    count: number;
  }[];
};

export type Statistics2v2 = CommonStatistics & {
  alliedTeamVictoryRatios: {
    allyPlayerId: string;
    allyPlayerName: string;
    victoryRatio: number;
    games: number;
  }[];
  alliedTeamDivisionVictoryRatios: {
    playerDivision: string;
    allyDivision: string;
    victoryRatio: number;
    games: number;
  }[];
  enemyTeamVictoryRatios: {
    enemyPlayer1Id: string;
    enemyPlayer1Name: string;
    enemyPlayer2Id: string;
    enemyPlayer2Name: string;
    victoryRatio: number;
    games: number;
  }[];
  enemyTeamDivisionVictoryRatios: {
    enemyDivision1: string;
    enemyDivision2: string;
    victoryRatio: number;
    games: number;
  }[];
}

type Counter = { victories: number, games: number };

function incrementCounter(
  map: Map<string, Counter>,
  key: string,
  isVictory: boolean
) {
  const counter = map.get(key);
  if (counter) {
    counter.games++;
    if (isVictory) {
      counter.victories++;
    }
  } else {
    map.set(key, { victories: isVictory ? 1 : 0, games: 1 });
  }
}

const getDivisionStats = (
  replays: Replay1v1[],
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
  replays: CommonReplayData[]
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

const getMapVictoryRatios = (replays: CommonReplayData[]) => {
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

  return Object.keys(mapStats)
    .map((map) => {
      const { total, won } = mapStats[map];
      return {
        map,
        victoryRatio: calculateVictoryRatio(won, total),
        games: total
      };
    })
    .sort((a, b) => b.victoryRatio - a.victoryRatio)
}

const calculateMostFrequentOpponents = (
  replays: Replay1v1[]
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

const calculateAverageGameDuration = (replays: CommonReplayData[]): number => {
  const totalDuration = replays.reduce((acc, replay) => acc + (replay.duration || 0), 0);
  return totalDuration / replays.length || 0;
};

const trackRankHistory = (replays: Replay1v1[]): { date: string; rank: number }[] => {
  return replays
    .map((replay) => ({
      date: replay.createdAt,
      rank: parseInt(replay.rank)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getStats1v1 = (replays: Replay1v1[]): Statistics1v1 => {
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
        victories: won,
        games: total
      };
    })
    .sort((a, b) => calculateWeightedWinRate(b.victories, b.games) - calculateWeightedWinRate(a.victories, a.games));

  const enemyDivisionStats = getDivisionStats(replays, 'enemyDivision');
  const enemyDivisionVictoryRatios = Object.keys(enemyDivisionStats)
    .map((enemyDivision) => {
      const { total, won } = enemyDivisionStats[enemyDivision];
      return {
        division: enemyDivision,
        victoryRatio: calculateVictoryRatio(won, total),
        victories: won,
        games: total
      };
    })
    .sort((a, b) => calculateWeightedWinRate(b.victories, b.games) - calculateWeightedWinRate(a.victories, a.games));

  const { longestWinningStreak, longestLosingStreak } = calculateStreaks(replays);
  const mostFrequentOpponents = calculateMostFrequentOpponents(replays);
  const averageGameDuration = calculateAverageGameDuration(replays);
  const rankHistory = trackRankHistory(replays);
  const mapVictoryRatios = getMapVictoryRatios(replays);

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

export const getStats2v2 = (replays: Replay2v2[]): Statistics2v2 => {
  const totalGames = replays.length;
  const wonGames = replays.filter((replay) => replay.result === 'Victory').length;
  const victoryRatio = calculateVictoryRatio(wonGames, totalGames);
  const { longestWinningStreak, longestLosingStreak } = calculateStreaks(replays);
  const mapVictoryRatios = getMapVictoryRatios(replays);
  const averageGameDuration = calculateAverageGameDuration(replays);
  const alliedVictories = new Map<string, { victories: number, games: number }>();
  const enemyVictories = new Map<string, { victories: number, games: number }>();
  const alliedDivisionVictories = new Map<string, { victories: number, games: number }>();
  const enemyDivisionVictories = new Map<string, { victories: number, games: number }>();

  replays.forEach(replay => {
    const sortedEnemies = replay.enemiesData;
    sortedEnemies.sort((enemy1, enemy2) => enemy1.playerId.localeCompare(enemy2.playerId));
    const sortedEnemyDivisions = replay.enemiesData.map(data => data.playerDivision);
    const compositeEnemyKey = JSON.stringify([sortedEnemies[0].playerId, sortedEnemies[1].playerId]);
    sortedEnemyDivisions.sort((div1, div2) => div1.localeCompare(div2));
    const compositeAlliedDivisionKey
      = JSON.stringify([replay.division, replay.allyData.playerDivision]);
    const compositeEnemyDivisionKey
      = JSON.stringify([sortedEnemyDivisions[0], sortedEnemyDivisions[1]]);
    const isVictory = replay.result === 'Victory';
    const isDefeat = replay.result === 'Defeat';

    incrementCounter(alliedVictories, replay.allyData.playerId, isVictory);
    incrementCounter(alliedDivisionVictories, compositeAlliedDivisionKey, isVictory);
    incrementCounter(enemyVictories, compositeEnemyKey, isDefeat);
    incrementCounter(enemyDivisionVictories, compositeEnemyDivisionKey, isDefeat);
  })

  const playerIdMap = getPlayerIdCommonNameMap(replays);
  const alliedTeamVictoryRatios = Array.from(alliedVictories).map(([key, obj]) => ({
    allyPlayerId: key,
    allyPlayerName: playerIdMap.get(key) ?? 'unknown',
    victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
    victories: obj.victories,
    games: obj.games
  })).sort((stat1, stat2) => calculateWeightedWinRate(stat2.victories, stat2.games) - calculateWeightedWinRate(stat1.victories, stat1.games));

  const enemyTeamVictoryRatios = Array.from(enemyVictories).map(([key, obj]) => ({
    enemyPlayer1Id: JSON.parse(key)[0],
    enemyPlayer1Name: playerIdMap.get(JSON.parse(key)[0]) ?? 'unknown',
    enemyPlayer2Id: JSON.parse(key)[1],
    enemyPlayer2Name: playerIdMap.get(JSON.parse(key)[1]) ?? 'unknown',
    victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
    victories: obj.victories,
    games: obj.games
  })).sort((stat1, stat2) => calculateWeightedWinRate(stat2.victories, stat2.games) - calculateWeightedWinRate(stat1.victories, stat1.games));

  const alliedTeamDivisionVictoryRatios = Array.from(alliedDivisionVictories).map(([key, obj]) => ({
    playerDivision: JSON.parse(key)[0],
    allyDivision: JSON.parse(key)[1],
    victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
    victories: obj.victories,
    games: obj.games
  })).sort((stat1, stat2) => calculateWeightedWinRate(stat2.victories, stat2.games) - calculateWeightedWinRate(stat1.victories, stat1.games));

  const enemyTeamDivisionVictoryRatios = Array.from(enemyDivisionVictories).map(([key, obj]) => ({
    enemyDivision1: JSON.parse(key)[0],
    enemyDivision2: JSON.parse(key)[1],
    victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
    victories: obj.victories,
    games: obj.games
  })).sort((stat1, stat2) => calculateWeightedWinRate(stat2.victories, stat2.games) - calculateWeightedWinRate(stat1.victories, stat1.games));

  return {
    totalGames,
    wonGames,
    victoryRatio,
    averageGameDuration,
    longestWinningStreak,
    longestLosingStreak,
    mapVictoryRatios,
    alliedTeamVictoryRatios,
    alliedTeamDivisionVictoryRatios,
    enemyTeamVictoryRatios,
    enemyTeamDivisionVictoryRatios
  };
};