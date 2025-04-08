import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay } from '../parsers/replaysParser';
import { useEffect, useState } from 'react';
import { Player, playersParser } from '../parsers/playersParser';
import { List, Input, Button, Card, Empty, Table, Typography } from 'antd';
import { ArrowRightOutlined, LinkOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';

dayjs.extend(relativeTime);

const getMinMax = (arr: number[]): { min: number | null; max: number | null } =>
  arr.length ? { min: Math.min(...arr), max: Math.max(...arr) } : { min: null, max: null };

const columns: ColumnType<
  Pick<
    Player['history'][number],
    | 'result'
    | 'division'
    | 'enemyDivision'
    | 'enemyDeck'
    | 'createdAt'
    | 'duration'
    | 'map'
    | 'enemyRank'
  >
>[] = [
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) =>
      `${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <a
          href={`https://war-yes.com/deck-builder?code=${record.enemyDeck}`}
          target="_blank"
          rel="noreferrer">
          <LinkOutlined />
        </a>
      </div>
    )
  },
  {
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <a
          href={`https://war-yes.com/deck-builder?code=${record.enemyDeck}`}
          target="_blank"
          rel="noreferrer">
          <LinkOutlined />
        </a>
      </div>
    )
  },
  {
    title: 'Enemy Rank',
    dataIndex: 'enemyRank',
    key: 'enemyRank'
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss')
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map'
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result'
  }
];

export const Players = ({ replays }: { replays: Replay[] }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>();

  useEffect(() => {
    const fetchPlayers = async () => setPlayers(await playersParser(replays));

    fetchPlayers();
  }, [replays]);

  const filteredPlayers = players.filter((player) =>
    player.names.some((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlayerData = players.find((player) => player.id === selectedPlayer);

  return (
    <div className="flex gap-4">
      <div className="w-1/5 ">
        <Input.Search
          className="mb-4"
          placeholder="Filter players by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto pr-2">
          <List
            dataSource={filteredPlayers}
            size="small"
            renderItem={(player) => {
              const rankMinMax = getMinMax(
                player.history.flatMap(({ enemyRank }) => parseInt(enemyRank))
              );

              return (
                <List.Item
                  actions={[
                    <Button
                      icon={<ArrowRightOutlined />}
                      onClick={() => setSelectedPlayer(player.id)}
                      key="open"
                    />
                  ]}
                  className={
                    selectedPlayer === player.id ? 'bg-neutral-800' : 'hover:bg-neutral-900'
                  }
                  key={player.id}>
                  <List.Item.Meta
                    title={player.names.join(', ').replace(/(\S{15})(?=\S)/g, '$1 ')}
                    description={
                      rankMinMax.min === rankMinMax.max
                        ? `${rankMinMax.min}`
                        : `${rankMinMax.min} - ${rankMinMax.max}`
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
      <div className="w-4/5">
        <Card title={selectedPlayerData?.names.join(', ')}>
          {selectedPlayerData ? (
            <Table
              className="mb-4"
              dataSource={selectedPlayerData.history}
              columns={columns}
              size="small"
              rowKey="createdAt"
              pagination={false}
            />
          ) : (
            <Empty description="Select a player" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </div>
  );
};
