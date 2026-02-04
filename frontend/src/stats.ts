import { GetSettings } from '../wailsjs/go/main/App';
import { calculateVictoryRatio } from './helpers/calculateVictoryRatio';
import { calculateWeightedWinRate } from './helpers/calculateWeightedWinRate';
import { PlayerNamesMap } from './helpers/playerNamesMap';
import { CommonReplayData, Replay1v1, Replay2v2 } from './parsers/replaysParser';

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
};

export type DivisionStats = {
  total: number;
  won: number;
};

export type RankHistory = { date: string; rank: number }[];

export type Statistics1v1 = CommonStatistics & {
  rankHistory: RankHistory;
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
  timeSpent: number;
  averageWinDuration: number;
  averageLossDuration: number;
  winrateByEnemyRank: Record<
    string,
    {
      wins: number;
      total: number;
    }
  >;
  winrateByDuration: Record<
    string,
    {
      wins: number;
      total: number;
    }
  >;
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
};

type Counter = { victories: number; games: number };

function incrementCounter(map: Map<string, Counter>, key: string, isVictory: boolean) {
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
    .sort((a, b) => b.victoryRatio - a.victoryRatio);
};

const calculateAverageGameDuration = (replays: CommonReplayData[]): number => {
  const totalDuration = replays.reduce((acc, replay) => acc + (replay.duration || 0), 0);
  return totalDuration / replays.length || 0;
};

const calculateAverageDurationByResult = (
  replays: CommonReplayData[],
  result: CommonReplayData['result']
): number => {
  const filtered = replays.filter((r) => r.result === result);
  if (filtered.length === 0) return 0;
  return filtered.reduce((acc, r) => acc + (r.duration || 0), 0) / filtered.length;
};

const calculateEnemyRankBuckets = (
  replays: Replay1v1[]
): Record<
  string,
  {
    wins: number;
    total: number;
  }
> => {
  const enemyRankBuckets: Record<
    string,
    {
      wins: number;
      total: number;
    }
  > = {};

  const getBucket = (rank: number): string | null => {
    if (rank === 0) return null;
    if (rank <= 50) return '1-50';
    if (rank <= 100) return '51-100';
    if (rank <= 150) return '101-150';
    if (rank <= 200) return '151-200';
    if (rank <= 300) return '201-300';
    if (rank <= 400) return '301-400';
    if (rank <= 500) return '401-500';
    return '501+';
  };

  for (const replay of replays) {
    const enemyRank = parseInt(replay.enemyRank);

    if (isNaN(enemyRank)) continue;

    const bucket = getBucket(enemyRank);

    if (!bucket) continue;

    if (!enemyRankBuckets[bucket]) {
      enemyRankBuckets[bucket] = { wins: 0, total: 0 };
    }

    enemyRankBuckets[bucket].total += 1;

    if (replay.result === 'Victory') {
      enemyRankBuckets[bucket].wins += 1;
    }
  }

  return enemyRankBuckets;
};

const calculateDurationBuckets = (
  replays: CommonReplayData[]
): Record<
  string,
  {
    wins: number;
    total: number;
  }
> => {
  const buckets: Record<string, { wins: number; total: number }> = {};

  // Bucket boundaries in minutes (inclusive start, exclusive end), last one is open-ended.
  const boundaries = [0, 10, 20, 30, 40];

  const getBucketLabel = (minutes: number): string => {
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      if (minutes >= start && minutes < end) return `${start}-${end}m`;
    }
    const last = boundaries[boundaries.length - 1];
    return `${last}m+`;
  };

  for (const replay of replays) {
    const seconds = replay.duration || 0;
    const minutes = Math.floor(seconds / 60);
    const bucket = getBucketLabel(minutes);

    if (!buckets[bucket]) {
      buckets[bucket] = { wins: 0, total: 0 };
    }

    buckets[bucket].total += 1;
    if (replay.result === 'Victory') {
      buckets[bucket].wins += 1;
    }
  }

  return buckets;
};

const trackRankHistory = (replays: Replay1v1[]): { date: string; rank: number }[] => {
  return replays
    .map((replay) => ({
      date: replay.createdAt,
      rank: parseInt(replay.rank)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getStats1v1 = async (replays: Replay1v1[]) => {
  const settings = await GetSettings();

  replays = replays.filter((replay) => {
    const replayDate = new Date(replay.createdAt);
    const fromDate = settings.dateRangeFrom ? new Date(settings.dateRangeFrom) : null;
    const toDate = settings.dateRangeTo ? new Date(settings.dateRangeTo) : null;

    if (fromDate && toDate) {
      return replayDate >= fromDate && replayDate <= toDate;
    } else if (fromDate) {
      return replayDate >= fromDate;
    } else if (toDate) {
      return replayDate <= toDate;
    }
    return true; // no filtering if no dates provided
  });

  const totalGames = replays.length;
  const wonGames = replays.filter((replay) => replay.result === 'Victory').length;
  const victoryRatio = calculateVictoryRatio(wonGames, totalGames);
  const divisionStats = getDivisionStats(replays, 'division');
  const timeSpent = replays.reduce((acc, r) => acc + r.duration, 0);
  const winrateByEnemyRank = calculateEnemyRankBuckets(replays);
  const winrateByDuration = calculateDurationBuckets(replays);
  const averageWinDuration = calculateAverageDurationByResult(replays, 'Victory');
  const averageLossDuration = calculateAverageDurationByResult(replays, 'Defeat');

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
    .sort(
      (a, b) =>
        calculateWeightedWinRate(b.victories, b.games) -
        calculateWeightedWinRate(a.victories, a.games)
    );

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
    .sort(
      (a, b) =>
        calculateWeightedWinRate(b.victories, b.games) -
        calculateWeightedWinRate(a.victories, a.games)
    );

  const { longestWinningStreak, longestLosingStreak } = calculateStreaks(replays);
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
    longestWinningStreak,
    longestLosingStreak,
    rankHistory,
    mapVictoryRatios,
    timeSpent,
    averageWinDuration,
    averageLossDuration,
    winrateByEnemyRank,
    winrateByDuration
  };
};

export const getStats2v2 = (
  replays: Replay2v2[],
  playerNamesMap: PlayerNamesMap
): Statistics2v2 => {
  const totalGames = replays.length;
  const wonGames = replays.filter((replay) => replay.result === 'Victory').length;
  const victoryRatio = calculateVictoryRatio(wonGames, totalGames);
  const { longestWinningStreak, longestLosingStreak } = calculateStreaks(replays);
  const mapVictoryRatios = getMapVictoryRatios(replays);
  const averageGameDuration = calculateAverageGameDuration(replays);
  const alliedVictories = new Map<string, { victories: number; games: number }>();
  const enemyVictories = new Map<string, { victories: number; games: number }>();
  const alliedDivisionVictories = new Map<string, { victories: number; games: number }>();
  const enemyDivisionVictories = new Map<string, { victories: number; games: number }>();

  replays.forEach((replay) => {
    const sortedEnemies = replay.enemiesData;
    sortedEnemies.sort((enemy1, enemy2) => enemy1.playerId.localeCompare(enemy2.playerId));
    const sortedEnemyDivisions = replay.enemiesData.map((data) => data.playerDivision);
    const compositeEnemyKey = JSON.stringify([
      sortedEnemies[0].playerId,
      sortedEnemies[1].playerId
    ]);
    sortedEnemyDivisions.sort((div1, div2) => div1.localeCompare(div2));
    const compositeAlliedDivisionKey = JSON.stringify([
      replay.division,
      replay.allyData.playerDivision
    ]);
    const compositeEnemyDivisionKey = JSON.stringify([
      sortedEnemyDivisions[0],
      sortedEnemyDivisions[1]
    ]);
    const isVictory = replay.result === 'Victory';
    const isDefeat = replay.result === 'Defeat';

    incrementCounter(alliedVictories, replay.allyData.playerId, isVictory);
    incrementCounter(alliedDivisionVictories, compositeAlliedDivisionKey, isVictory);
    incrementCounter(enemyVictories, compositeEnemyKey, isDefeat);
    incrementCounter(enemyDivisionVictories, compositeEnemyDivisionKey, isDefeat);
  });

  const alliedTeamVictoryRatios = Array.from(alliedVictories)
    .map(([key, obj]) => ({
      allyPlayerId: key,
      allyPlayerName: playerNamesMap.getPlayerCommonName(key),
      victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
      victories: obj.victories,
      games: obj.games
    }))
    .sort(
      (stat1, stat2) =>
        calculateWeightedWinRate(stat2.victories, stat2.games) -
        calculateWeightedWinRate(stat1.victories, stat1.games)
    );

  const enemyTeamVictoryRatios = Array.from(enemyVictories)
    .map(([key, obj]) => ({
      enemyPlayer1Id: JSON.parse(key)[0],
      enemyPlayer1Name: playerNamesMap.getPlayerCommonName(JSON.parse(key)[0]),
      enemyPlayer2Id: JSON.parse(key)[1],
      enemyPlayer2Name: playerNamesMap.getPlayerCommonName(JSON.parse(key)[1]),
      victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
      victories: obj.victories,
      games: obj.games
    }))
    .sort(
      (stat1, stat2) =>
        calculateWeightedWinRate(stat2.victories, stat2.games) -
        calculateWeightedWinRate(stat1.victories, stat1.games)
    );

  const alliedTeamDivisionVictoryRatios = Array.from(alliedDivisionVictories)
    .map(([key, obj]) => ({
      playerDivision: JSON.parse(key)[0],
      allyDivision: JSON.parse(key)[1],
      victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
      victories: obj.victories,
      games: obj.games
    }))
    .sort(
      (stat1, stat2) =>
        calculateWeightedWinRate(stat2.victories, stat2.games) -
        calculateWeightedWinRate(stat1.victories, stat1.games)
    );

  const enemyTeamDivisionVictoryRatios = Array.from(enemyDivisionVictories)
    .map(([key, obj]) => ({
      enemyDivision1: JSON.parse(key)[0],
      enemyDivision2: JSON.parse(key)[1],
      victoryRatio: calculateVictoryRatio(obj.victories, obj.games),
      victories: obj.victories,
      games: obj.games
    }))
    .sort(
      (stat1, stat2) =>
        calculateWeightedWinRate(stat2.victories, stat2.games) -
        calculateWeightedWinRate(stat1.victories, stat1.games)
    );

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
