import { Card, Descriptions, DescriptionsProps, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Replay1v1 } from '../parsers/replaysParser';
import dayjs from 'dayjs';
import { formatDuration } from '../helpers/formatDuration';
import { GetEugenPlayer } from '../../wailsjs/go/main/App';

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

const calculateStats = (replays: Replay1v1[], rank: string) => {
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

  return {
    playerName,
    gamesPlayed,
    timeSpent,
    wins,
    losses,
    draws,
    winRate,
    eloChange,
    rank: rank || 'Unranked'
  };
};

export const DailyRecap = ({ replays }: DailyRecapProps) => {
  const [statsByPlayer, setStatsByPlayer] = useState<
    Record<string, ReturnType<typeof calculateStats>>
  >({});

  useEffect(() => {
    const uniquePlayerIds = Array.from(new Set(replays.map((r) => r.playerId)));
    const newStats: Record<string, ReturnType<typeof calculateStats>> = {};

    uniquePlayerIds.forEach(async (playerId) => {
      const playerReplays = replays.filter((r) => r.playerId === playerId);

      const { ELO_LB_rank } = await GetEugenPlayer(playerId);
      const stats = calculateStats(playerReplays, ELO_LB_rank);
      if (stats) newStats[playerId] = stats;
    });

    setStatsByPlayer(newStats);
  }, [replays]);

  return (
    <Spin spinning={false}>
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
              key: 'gamesPlayed',
              label: 'Games Played',
              children: `${stats.gamesPlayed} ${pluralize(stats.gamesPlayed, 'game', 'games')}`
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
              )}`
            },
            {
              key: 'eloChange',
              label: 'Elo Change',
              children: `${stats.eloChange > 0 ? '+' : ''}${stats.eloChange}`
            }
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
