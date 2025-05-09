import { CommonReplayData, getDivisionName, Replay1v1, Replay2v2 } from './parsers/replaysParser';

export type CommonStatistics = {
  totalGames: number;
  wonGames: number;
  victoryRatio: number;
  longestWinningStreak: number;
  longestLosingStreak: number;
  averageGameDuration: number;
  divisionVictoryRatios: {
    division: string;
    victoryRatio: number;
    games: number;
  }[];
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
  mostFrequentOpponents: {
    enemyDivision: string;
    count: number;
  }[];
};

export type Statistics2v2 = CommonStatistics & {
  alliedTeamVictoryRatios: {
    allyPlayerId: string;
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
    enemyPlayer2Id: string;
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

const calculateVictoryRatio = (won: number, total: number): number => {
  return total === 0 ? 0 : (won / total) * 100;
};

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
    // sort enemies and divs to prevent P1/D1: a, P2/D2: b being unique from P1/D1: b, P2/D2: a
    const sortedEnemies = replay.enemiesData;
    sortedEnemies.sort((enemy1, enemy2) => enemy1.playerId.localeCompare(enemy2.playerId));
    const sortedEnemyDivisions = replay.enemiesData.map(data => data.playerDivision);
    const compositeEnemyKey = JSON.stringify([sortedEnemies[0], sortedEnemies[1]]);
    sortedEnemyDivisions.sort((div1, div2) => div1.localeCompare(div2));
    const compositeAlliedDivisionKey 
      = JSON.stringify([getDivisionName(replay.division), getDivisionName(replay.allyData.playerDivision)]);
    const compositeEnemyDivisionKey
      = JSON.stringify([getDivisionName(sortedEnemyDivisions[0]), getDivisionName(sortedEnemyDivisions[1])]);


    if (replay.result == 'Victory') {
      const existing = alliedVictories.get(replay.allyData.playerId);
      if (existing) {
        existing.victories++;
        existing.games++;
      } else {
        alliedVictories.set(replay.allyData.playerId, { victories: 1, games: 1 });
      }
    } else if (replay.result == 'Defeat') {
      const existing = enemyVictories.get(compositeEnemyKey);
      if (existing) {
        existing.victories++;
        existing.games++;
      } else {
        enemyVictories.set(JSON.stringify(compositeEnemyKey), { victories: 1, games: 1 });
      }
    } else {
      const existingAlliedVictory = alliedVictories.get(replay.allyData.playerId);
      const existingEnemyVictory = enemyVictories.get(compositeEnemyKey);
      if (existingAlliedVictory) {
        existingAlliedVictory.games++;
      } else {
        alliedDivisionVictories.set(replay.allyData.playerId, { victories: 0, games: 1 });
      }

      if (existingEnemyVictory) {
        existingEnemyVictory.games++;
      } else {
        enemyDivisionVictories.set(compositeEnemyKey, { victories: 0, games: 1 });
      }
    }
  })

  const alliedTeamVictoryRatios = Array.from(alliedVictories).map(([key, obj]) => ({
    allyPlayerId: key,
    victoryRatio: obj.games ? obj.games / obj.victories : 0,
    games: obj.games
  }));
  const enemyTeamVictoryRatios = Array.from(enemyVictories).map(([key, obj]) => ({
    enemyPlayer1Id: JSON.parse(key)[0],
    enemyPlayer2Id: JSON.parse(key)[1],
    victoryRatio: obj.games ? obj.games / obj.victories : 0,
    games: obj.games
  }));

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