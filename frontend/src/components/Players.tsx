import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay } from '../parsers/replaysParser';
import { useEffect, useState } from 'react';
import { Player, playersParser } from '../parsers/playersParser';
import { List, Input, Button, Card, Empty, Typography, Tag } from 'antd';
import { ArrowRightOutlined, CopyOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PlayerDetails } from './PlayerDetails/PlayerDetails';
import { getMinMax } from '../helpers/getMinMax';
import { transliterate } from '../helpers/transliterate';

dayjs.extend(relativeTime);

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
    key: 'division'
  },
  {
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.enemyDeck}>
          <CopyOutlined />
        </CopyToClipboard>
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

  const filteredPlayers = players.filter((player) => {
    const normalizedQuery = transliterate(searchQuery.toLowerCase());

    return (
      player.names.some((name) => transliterate(name.toLowerCase()).includes(normalizedQuery)) ||
      transliterate(player.id.toLowerCase()).includes(normalizedQuery)
    );
  });

  const selectedPlayerData = players.find((player) => player.id === selectedPlayer);

  return (
    <div className="flex gap-4">
      <div className="w-1/5 ">
        <Input.Search
          className="mb-4"
          placeholder="Filter players by name or id"
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
                    title={<Typography.Text strong>{player.names.join(', ')}</Typography.Text>}
                    description={
                      rankMinMax.min ? (
                        <div className="flex items-center">
                          <div
                            className={[
                              'w-2 h-2 rounded-full mr-1',
                              rankMinMax.min <= 50
                                ? 'bg-rose-600'
                                : rankMinMax.min <= 100
                                ? 'bg-orange-600'
                                : rankMinMax.min <= 200
                                ? 'bg-yellow-600'
                                : rankMinMax.min <= 500
                                ? 'bg-emerald-600'
                                : 'bg-neutral-600'
                            ].join(' ')}
                          />

                          {rankMinMax.min === rankMinMax.max
                            ? `${rankMinMax.min}`
                            : `${rankMinMax.min} - ${rankMinMax.max}`}
                        </div>
                      ) : null
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
      <div className="w-4/5">
        {selectedPlayerData ? (
          <PlayerDetails player={selectedPlayerData} />
        ) : (
          <Card>
            <Empty description="Select a player" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        )}
      </div>
    </div>
  );
};
