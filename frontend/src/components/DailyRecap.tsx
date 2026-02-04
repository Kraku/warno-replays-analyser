import { Card, Descriptions, DescriptionsProps, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Replay1v1 } from '../parsers/replaysParser';
import dayjs from 'dayjs';
import { formatDuration } from '../helpers/formatDuration';
import { GetEugenPlayer, GetLeaderboard } from '../../wailsjs/go/main/App';
import type { main } from '../../wailsjs/go/models';

type DailyRecapProps = {
  replays: Replay1v1[];
};

const isToday = (dateStr: string) => dayjs(dateStr).isSame(dayjs(), 'day');

const ColoredCircle = ({ winRate }: { winRate: number }) => {
  const getWinRateColorClass = () => {
    if (winRate >= 70) return 'bg-green-500';
    if (winRate >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <span className={`${getWinRateColorClass()} inline-block w-2.5 h-2.5 rounded-full ml-2`} />
  );
};

const pluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural;

const mostCommonString = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  let best: { value: string; count: number } | undefined;
  for (const [value, count] of counts.entries()) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && value.localeCompare(best.value) < 0)
    ) {
      best = { value, count };
    }
  }
  return best;
};

const safeParseInt = (value: string | undefined) => {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
};

const safeParseFloat = (value: string | undefined) => {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
};

const getNextRankMilestone = (currentRank: number | undefined) => {
  if (!currentRank || currentRank <= 1) return undefined;

  // Milestone rules:
  // - Ranks > 1000: milestones every 1000 (e.g. 5000 -> 4000)
  // - Ranks 101..1000: milestones every 100 (e.g. 118 -> 100)
  // - Ranks 2..100: milestones at 75/50/25/10/3/2/1
  if (currentRank <= 100) {
    const milestones = [75, 50, 25, 10, 3, 2, 1];
    for (const m of milestones) {
      if (currentRank > m) return m;
    }
    return undefined;
  }

  if (currentRank <= 1000) {
    return Math.floor((currentRank - 1) / 100) * 100;
  }

  return Math.floor((currentRank - 1) / 1000) * 1000;
};

const calculateStats = (
  replays: Replay1v1[],
  rank: string | undefined,
  currentElo: number | undefined,
  leaderboard: main.LeaderboardEntry[]
) => {
  const todaysReplays = replays.filter((r) => isToday(r.createdAt));
  if (!todaysReplays.length) return undefined;

  const gamesPlayed = todaysReplays.length;
  const timeSpent = todaysReplays.reduce((acc, r) => acc + r.duration, 0);
  const wins = todaysReplays.filter((r) => r.result === 'Victory').length;
  const losses = todaysReplays.filter((r) => r.result === 'Defeat').length;
  const draws = todaysReplays.filter((r) => r.result === 'Draw').length;
  const winRate = Math.round((wins / gamesPlayed) * 100);
  const eloChange = Number(todaysReplays.reduce((acc, r) => acc + r.eloChange, 0).toFixed(2));
  const playerName = todaysReplays[0].playerName;

  const topMap = mostCommonString(todaysReplays.map((r) => r.map));
  const topDivision = mostCommonString(todaysReplays.map((r) => r.division));
  const longestDuration = Math.max(...todaysReplays.map((r) => r.duration ?? 0));

  const enemyRanks = todaysReplays
    .map((r) => safeParseInt(r.enemyRank))
    .filter((n): n is number => n !== undefined && n > 0);
  const avgEnemyRank = enemyRanks.length
    ? Number((enemyRanks.reduce((a, b) => a + b, 0) / enemyRanks.length).toFixed(0))
    : undefined;

  const eloDiffs = todaysReplays
    .map((r) => {
      const p = safeParseFloat(r.playerElo);
      const e = safeParseFloat(r.enemyElo);
      return p !== undefined && e !== undefined ? p - e : undefined;
    })
    .filter((n): n is number => n !== undefined);
  const avgEloDiff = eloDiffs.length
    ? Number((eloDiffs.reduce((a, b) => a + b, 0) / eloDiffs.length).toFixed(0))
    : undefined;

  const sortedByTime = [...todaysReplays].sort(
    (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
  );
  let bestWinStreak = 0;
  let runningWinStreak = 0;
  for (const r of sortedByTime) {
    if (r.result === 'Victory') {
      runningWinStreak += 1;
      bestWinStreak = Math.max(bestWinStreak, runningWinStreak);
    } else {
      runningWinStreak = 0;
    }
  }
  let currentWinStreak = 0;
  for (let i = sortedByTime.length - 1; i >= 0; i--) {
    if (sortedByTime[i].result === 'Victory') currentWinStreak += 1;
    else break;
  }

  const rankNumber = safeParseInt(rank);
  const nextMilestoneRank = getNextRankMilestone(rankNumber);
  const milestoneEntry =
    nextMilestoneRank && leaderboard.length >= nextMilestoneRank
      ? leaderboard[nextMilestoneRank - 1]
      : undefined;
  const targetElo = milestoneEntry?.elo;
  const eloNeededRaw =
    currentElo !== undefined && targetElo !== undefined ? targetElo - currentElo : undefined;
  const eloNeeded =
    eloNeededRaw !== undefined ? Math.max(0, Number(eloNeededRaw.toFixed(2))) : undefined;

  return {
    playerName,
    gamesPlayed,
    timeSpent,
    wins,
    losses,
    draws,
    winRate,
    eloChange,
    rank: rank || 'Unranked',
    currentElo,
    nextMilestoneRank,
    targetElo,
    eloNeeded,
    topMap,
    topDivision,
    longestDuration,
    avgEnemyRank,
    avgEloDiff,
    bestWinStreak,
    currentWinStreak
  };
};

export const DailyRecap = ({ replays }: DailyRecapProps) => {
  const [statsByPlayer, setStatsByPlayer] = useState<
    Record<string, ReturnType<typeof calculateStats>>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (!replays.length) {
          setStatsByPlayer({});
          return;
        }

        const leaderboard = await GetLeaderboard().catch(() => []);
        const replaysByPlayer = new Map<string, Replay1v1[]>();
        for (const replay of replays) {
          const list = replaysByPlayer.get(replay.playerId);
          if (list) list.push(replay);
          else replaysByPlayer.set(replay.playerId, [replay]);
        }

        const uniquePlayerIds = Array.from(replaysByPlayer.keys());
        const newStats: Record<string, ReturnType<typeof calculateStats>> = {};

        await Promise.all(
          uniquePlayerIds.map(async (playerId) => {
            const playerReplays = replaysByPlayer.get(playerId) ?? [];
            const eugenPlayer = await GetEugenPlayer(playerId);
            const rank = eugenPlayer?.ELO_LB_rank;
            const currentElo = safeParseFloat(eugenPlayer?.ELO);

            const stats = calculateStats(playerReplays, rank, currentElo, leaderboard);
            if (stats) newStats[playerId] = stats;
          })
        );

        setStatsByPlayer(newStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [replays]);

  return (
    <Spin spinning={loading}>
      <div
        className={
          Object.keys(statsByPlayer).length === 1
            ? 'w-full'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4'
        }>
        {Object.entries(statsByPlayer).map(([playerId, stats]) => {
          if (!stats) return null;

          const descriptionItems: DescriptionsProps['items'] = [
            {
              key: 'rank',
              label: 'Rank',
              children: stats.rank
            },
            {
              key: 'timeSpent',
              label: 'Time Spent',
              children: formatDuration(stats.timeSpent)
            },
            {
              key: 'winRate',
              label: 'Win Rate',
              children: (
                <div className="flex items-center">
                  {stats.winRate}% <ColoredCircle winRate={stats.winRate} />
                </div>
              )
            },
            {
              key: 'results',
              label: 'Results',
              children: `${stats.wins} ${pluralize(stats.wins, 'win', 'wins')} / ${
                stats.losses
              } ${pluralize(stats.losses, 'loss', 'losses')} / ${stats.draws} ${pluralize(
                stats.draws,
                'draw',
                'draws'
              )} (${stats.gamesPlayed} ${pluralize(stats.gamesPlayed, 'game', 'games')})`
            },
            ...(stats.avgEnemyRank !== undefined
              ? [
                  {
                    key: 'avgEnemyRank',
                    label: 'Avg Opponent Rank',
                    children: <span>{stats.avgEnemyRank}</span>
                  }
                ]
              : []),
            {
              key: 'eloChange',
              label: 'Estimated Elo Change',
              children: `${stats.eloChange > 0 ? '+' : ''}${stats.eloChange}`
            },
            ...(stats.nextMilestoneRank && stats.eloNeeded !== undefined
              ? [
                  {
                    key: 'milestone',
                    label: 'Next Milestone',
                    children: (
                      <span>
                        rank {stats.nextMilestoneRank} (need +{stats.eloNeeded} elo)
                      </span>
                    )
                  }
                ]
              : [])
          ];

          return (
            <Card
              key={playerId}
              size="small"
              type="inner"
              title={stats.playerName}
              extra="Daily Ranked Recap"
              className="mb-4">
              <Descriptions items={descriptionItems} column={3} size="small" />
            </Card>
          );
        })}
      </div>
    </Spin>
  );
};
