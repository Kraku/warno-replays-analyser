import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay } from '../parsers/replaysParser';
import { Player, playersParser } from '../parsers/playersParser';
import { List, Input, Button, Card, Empty } from 'antd';
import { ApiOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { PlayerDetails } from './PlayerDetails/PlayerDetails';
import { transliterate } from '../helpers/transliterate';
import { SearchPlayerInApi, SendPlayersToAPI } from '../../wailsjs/go/main/App';
import { PlayerNamesMap } from '../helpers/playerNamesMap';
import { main } from '../../wailsjs/go/models';
import { RankIndicator } from './RankIndicator';
import { getMinMax } from '../helpers/getMinMax';
import { useDebounce } from '../hooks/useDebounce';

dayjs.extend(relativeTime);

export const Players = ({
  replays,
  playerNamesMap,
  selectedPlayerId,
  onSelectedPlayerChange
}: {
  replays: Replay[];
  playerNamesMap: PlayerNamesMap;
  selectedPlayerId?: string;
  onSelectedPlayerChange?: (playerId?: string) => void;
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = trimmedSearchQuery.replace(/\s+/g, ' ');
  const debouncedSearchQuery = useDebounce(normalizedSearchQuery, 300);
  const [internalSelectedPlayer, setInternalSelectedPlayer] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const selectedPlayer = selectedPlayerId ?? internalSelectedPlayer;
  const setSelectedPlayer = onSelectedPlayerChange ?? setInternalSelectedPlayer;

  const mergeWithApiPlayers = (
    parsedPlayers: Player[],
    apiPlayers: main.GetUser[] = []
  ): Player[] => {
    return parsedPlayers.map((player) => {
      const apiPlayer = apiPlayers.find((apiPlayer) => apiPlayer.eugenId.toString() === player.id);

      if (!apiPlayer) return player;

      apiPlayer?.usernames.forEach((username) => {
        playerNamesMap.incrementPlayerNameCount(player.id, username);
      });

      const ranks = Array.from(
        new Set([
          ...player.history.map((history) => history.enemyRank),
          ...(apiPlayer?.ranks || [])
        ])
      )
        .map(String)
        .filter((rank) => rank !== '0');

      return {
        ...player,
        ranks,
        lastKnownRank: apiPlayer.lastKnownRank,
        lastKnownRankCreatedAt: apiPlayer.lastKnownRankCreatedAt,
        oldestReplayCreatedAt: apiPlayer.oldestReplayCreatedAt
      };
    });
  };

  useEffect(() => {
    const fetchApiPlayers = async () => {
      if (debouncedSearchQuery.length > 0) {
        await handleApiSearch(debouncedSearchQuery);
      }
    };

    fetchApiPlayers();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (!selectedPlayerId) return;
    if (players.some((p) => p.id === selectedPlayerId)) return;

    handleApiSearch(selectedPlayerId);
  }, [selectedPlayerId, players]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);

      const parsedPlayers = await playersParser(replays);

      await SendPlayersToAPI(
        parsedPlayers.map((player) => {
          const sortedHistory = [...player.history].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const newest = sortedHistory[0];
          const oldest = sortedHistory[sortedHistory.length - 1];

          return {
            usernames: playerNamesMap.getNames(player.id),
            ranks: player.history.map((history) => parseInt(history.enemyRank)),
            eugenId: parseInt(player.id),
            steamId: player.steamId || '',
            lastKnownRank: newest ? parseInt(newest.enemyRank) : undefined,
            lastKnownRankCreatedAt: newest ? dayjs(newest.createdAt).toISOString() : undefined,
            oldestReplayCreatedAt: oldest ? dayjs(oldest.createdAt).toISOString() : undefined
          };
        }) as main.PostUser[]
      );

      const apiPlayers = (await SearchPlayerInApi('')) || [];

      setPlayers(mergeWithApiPlayers(parsedPlayers, apiPlayers));

      setIsLoading(false);
    };

    fetch();
  }, [replays.length]);

  const handleApiSearch = async (query: string) => {
    const apiPlayers = (await SearchPlayerInApi(query)) || [];

    setPlayers((prevPlayers) => {
      const newPlayers = apiPlayers
        .filter(
          (apiPlayer) => !prevPlayers.some((player) => player.id === apiPlayer.eugenId.toString())
        )
        .map((apiPlayer) => {
          apiPlayer.usernames.forEach((username) =>
            playerNamesMap.incrementPlayerNameCount(apiPlayer.eugenId.toString(), username)
          );

          return {
            id: apiPlayer.eugenId.toString(),
            ranks: apiPlayer.ranks?.map(String),
            steamId: apiPlayer.steamId || '',
            history: [],
            api: true
          };
        });

      return [...prevPlayers, ...newPlayers];
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPlayers = players.filter((player) => {
    const normalizedQuery = transliterate(normalizedSearchQuery.toLowerCase());

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
            loading={isLoading}
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
                  className={
                    selectedPlayer === player.id ? 'bg-neutral-800' : 'hover:bg-neutral-900'
                  }
                  key={player.id}>
                  <List.Item.Meta
                    title={
                      <div className="flex-inline">
                        {player.api && <ApiOutlined className="mr-1" />}
                        {playerNamesMap.getPlayerCommonName(player.id)}
                        {playerNamesMap.getNames(player.id).length > 1 ? (
                          <span className="text-neutral-500">
                            {' '}
                            ({playerNamesMap.getNames(player.id).length} names)
                          </span>
                        ) : null}
                      </div>
                    }
                    description={<RankIndicator rankMinMax={rankMinMax} />}
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
      <div className="w-4/5">
        {selectedPlayerData ? (
          <PlayerDetails
            player={selectedPlayerData}
            playerNamesMap={playerNamesMap}
          />
        ) : (
          <Card>
            <Empty description="Select a player" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        )}
      </div>
    </div>
  );
};
