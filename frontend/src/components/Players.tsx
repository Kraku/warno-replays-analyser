import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay1v1 } from '../parsers/replaysParser';
import { Player, playersParser } from '../parsers/playersParser';
import { List, Input, Button, Card, Empty, Typography } from 'antd';
import { ApiOutlined, ArrowRightOutlined, CopyOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PlayerDetails } from './PlayerDetails/PlayerDetails';
import { getMinMax } from '../helpers/getMinMax';
import { transliterate } from '../helpers/transliterate';
import { GetSettings, SearchPlayerInApi, SendUsersToAPI } from '../../wailsjs/go/main/App';
import { PlayerNamesMap } from '../helpers/playerNamesMap';

dayjs.extend(relativeTime);

const columns: ColumnType<Pick<Player['history'][number], 'result' | 'division' | 'enemyDivision' | 'enemyDeck' | 'createdAt' | 'duration' | 'map' | 'enemyRank'>>[] = [
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => `${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`
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

export const Players = ({ replays, playerNamesMap }: { replays: Replay1v1[], playerNamesMap: PlayerNamesMap }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>();

  useEffect(() => {
    const fetchPlayers = async () => {
      const parsedPlayers = await playersParser(replays);
      setPlayers(parsedPlayers);
    };

    fetchPlayers();
  }, [replays]);

  useEffect(() => {
    const fetchSettingsAndSendUsers = async () => {
      const settings = await GetSettings();

      if (settings.playerInfoSharingDisabled || !players.length) return;

      SendUsersToAPI(
        players.map((player) => ({
          usernames: playerNamesMap.getNames(player.id),
          ranks: player.history.map((history) => parseInt(history.enemyRank)),
          eugenId: parseInt(player.id)
        }))
      );
    };

    fetchSettingsAndSendUsers();
  }, [players]);

  const handleApiSearch = async (query: string) => {
    const apiPlayers = await SearchPlayerInApi(query) || [];
    setPlayers((prevPlayers) => {
      const newPlayers = apiPlayers
        .filter((apiPlayer) => !prevPlayers.some((player) => player.id === apiPlayer.eugenId.toString()))
        .map((apiPlayer) => ({
          id: apiPlayer.eugenId.toString(),
          names: apiPlayer.usernames,
          ranks: apiPlayer.ranks.map(String),
          history: [],
          api: true
        }));

      return [...prevPlayers, ...newPlayers];
    });
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    setSearchQuery(query);

    if (query.length >= 2) {
      const settings = await GetSettings();

      if (settings.playerInfoSharingDisabled || !players.length) return;

      handleApiSearch(query);
    }
  };

  const filteredPlayers = players.filter((player) => {
    const normalizedQuery = transliterate(searchQuery.toLowerCase());

    return (
      playerNamesMap.nameMatches(player.id, normalizedQuery) ||
      transliterate(player.id.toLowerCase()).includes(normalizedQuery)
    );
  });

  const selectedPlayerData = players.find((player) => player.id === selectedPlayer);

  return (
    <div className="flex gap-4">
      <div className="w-1/5">
        <Input.Search
          className="mb-4"
          placeholder="Filter players by name or id"
          value={searchQuery}
          onChange={handleSearch}
          allowClear
        />
        <div className="max-h-[calc(100vh-23rem)] overflow-y-auto pr-2">
          <List
            dataSource={filteredPlayers}
            size="small"
            renderItem={(player) => {
              const rankMinMax = getMinMax(player.ranks.flatMap((rank) => parseInt(rank)));

              return (
                <List.Item
                  actions={[
                    <Button
                      icon={<ArrowRightOutlined />}
                      onClick={() => setSelectedPlayer(player.id)}
                      key="open"
                    />
                  ]}
                  className={selectedPlayer === player.id ? 'bg-neutral-800' : 'hover:bg-neutral-900'}
                  key={player.id}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex gap-1 items-center">
                        {player.api && <ApiOutlined />}
                        <Typography.Text strong>{playerNamesMap.getNames(player.id).join(', ')}</Typography.Text>
                      </div>
                    }
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
          <PlayerDetails player={selectedPlayerData} playerNamesMap={playerNamesMap} />
        ) : (
          <Card>
            <Empty description="Select a player" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        )}
      </div>
    </div>
  );
};
