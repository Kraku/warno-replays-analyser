import { useEffect, useMemo, useState } from 'react';
import { Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { GetPlayerReplays, GetSettings } from '../../../wailsjs/go/main/App';
import { main } from '../../../wailsjs/go/models';

dayjs.extend(relativeTime);

type DivisionsProps = {
  playerId: string;
};

export const Divisions = ({ playerId }: DivisionsProps) => {
  const [replays, setReplays] = useState<main.GetReplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const playerReplays = await GetPlayerReplays(playerId);
      setReplays(playerReplays);

      setIsLoading(false);
    })();
  }, [playerId]);

  const divisionStats = useMemo(() => {
    const statsMap = new Map<string, { division: string; count: number; lastUsed: string }>();

    for (const { division, createdAt } of replays) {
      const existing = statsMap.get(division);

      if (existing) {
        existing.count += 1;
        if (new Date(createdAt) > new Date(existing.lastUsed)) {
          existing.lastUsed = createdAt;
        }
      } else {
        statsMap.set(division, { division, count: 1, lastUsed: createdAt });
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }, [replays]);

  const columns = [
    {
      title: 'Division',
      dataIndex: 'division',
      key: 'division'
    },
    {
      title: 'Games',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date: string) => dayjs(date).fromNow()
    }
  ];

  if (isLoading || divisionStats.length === 0) {
    return null;
  }

  return (
    <Table
      columns={columns}
      dataSource={divisionStats}
      rowKey="division"
      loading={isLoading}
      size="small"
      pagination={{ pageSize: 10 }}
    />
  );
};
