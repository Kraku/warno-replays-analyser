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

const calculateStats = (replays: Replay1v1[]) => {
  const todaysReplays = replays.filter((r) => isToday(r.createdAt));
  if (!todaysReplays.length) return undefined;

  const gamesPlayed = todaysReplays.length;
  const timeSpent = todaysReplays.reduce((acc, r) => acc + r.duration, 0);
  const wins = todaysReplays.filter((r) => r.result === 'Victory').length;
  const losses = todaysReplays.filter((r) => r.result === 'Defeat').length;
  const draws = todaysReplays.filter((r) => r.result === 'Draw').length;
  const winRate = Math.round((wins / gamesPlayed) * 100);

  return { gamesPlayed, timeSpent, wins, losses, draws, winRate };
};

export const DailyRecap = ({ replays }: DailyRecapProps) => {
  const [stats, setStats] = useState<ReturnType<typeof calculateStats>>();

  useEffect(() => {
    setStats(calculateStats(replays));
  }, [replays]);

  const descriptionItems: DescriptionsProps['items'] = [
    { key: 'gamesPlayed', label: 'Games Played', children: stats?.gamesPlayed ?? 0 },
    {
      key: 'timeSpent',
      label: 'Time Spent',
      children: stats ? formatDuration(stats.timeSpent) : '0m'
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
    { key: 'wins', label: 'Wins', children: stats?.wins ?? 0 },
    { key: 'losses', label: 'Losses', children: stats?.losses ?? 0 },
    { key: 'draws', label: 'Draws', children: stats?.draws ?? 0 }
  ];

  return (
    <Card size="small" title="Daily Ranked Recap">
      <Spin spinning={false}>
        <Descriptions items={descriptionItems} column={3} size="small" />
      </Spin>
    </Card>
  );
};
