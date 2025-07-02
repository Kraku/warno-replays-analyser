import { Card, Descriptions, DescriptionsProps, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Replay1v1 } from '../parsers/replaysParser';
import dayjs from 'dayjs';
import { formatDuration } from '../helpers/formatDuration';

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

const calculateStats = (replays: Replay1v1[]) => {
  const todaysReplays = replays.filter((r) => isToday(r.createdAt));
  if (!todaysReplays.length) return undefined;

  const gamesPlayed = todaysReplays.length;
  const timeSpent = todaysReplays.reduce((acc, r) => acc + r.duration, 0);
  const wins = todaysReplays.filter((r) => r.result === 'Victory').length;
  const losses = todaysReplays.filter((r) => r.result === 'Defeat').length;
  const draws = todaysReplays.filter((r) => r.result === 'Draw').length;
  const winRate = Math.round((wins / gamesPlayed) * 100);
  const eloChange = Number(todaysReplays.reduce((acc, r) => acc + r.eloChange, 0).toFixed(2));

  return { gamesPlayed, timeSpent, wins, losses, draws, winRate, eloChange };
};

export const DailyRecap = ({ replays }: DailyRecapProps) => {
  const [stats, setStats] = useState<ReturnType<typeof calculateStats>>();

  useEffect(() => {
    setStats(calculateStats(replays));
  }, [replays]);

  const descriptionItems: DescriptionsProps['items'] = [
    {
      key: 'gamesPlayed',
      label: 'Games Played',
      children: `${stats?.gamesPlayed ?? 0} ${pluralize(stats?.gamesPlayed ?? 0, 'game', 'games')}`
    },
    {
      key: 'timeSpent',
      label: 'Time Spent',
      children: stats ? formatDuration(stats.timeSpent) : '0m'
    },
    {
      key: 'empty',
      label: '',
      children: ''
    },
    {
      key: 'winRate',
      label: 'Win Rate',
      children: stats ? (
        <div className="flex items-center">
          {stats.winRate}% <ColoredCircle winRate={stats.winRate} />
        </div>
      ) : (
        '0%'
      )
    },
    {
      key: 'results',
      label: 'Results',
      children: `${stats?.wins ?? 0} ${pluralize(stats?.wins ?? 0, 'win', 'wins')} / ${
        stats?.losses ?? 0
      } ${pluralize(stats?.losses ?? 0, 'loss', 'losses')} / ${stats?.draws ?? 0} ${pluralize(
        stats?.draws ?? 0,
        'draw',
        'draws'
      )}`
    },
    {
      key: 'eloChange',
      label: 'Elo Change',
      children: stats ? `${stats.eloChange > 0 ? '+' : ''}${stats.eloChange}` : '0'
    }
  ];

  return (
    <Card size="small" title="Daily Ranked Recap">
      <Spin spinning={false}>
        <Descriptions items={descriptionItems} column={3} size="small" />
      </Spin>
    </Card>
  );
};
