import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay1v1 } from '../parsers/replaysParser';
import { Player, playersParser } from '../parsers/playersParser';
import { List, Input, Button, Card, Empty, Typography } from 'antd';
import { ApiOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { PlayerDetails } from './PlayerDetails/PlayerDetails';
import { getMinMax } from '../helpers/getMinMax';
import { transliterate } from '../helpers/transliterate';
import { GetSettings, SearchPlayerInApi, SendUsersToAPI } from '../../wailsjs/go/main/App';
import { PlayerNamesMap } from '../helpers/playerNamesMap';
import { main } from '../../wailsjs/go/models';
import {RankIndicator} from './RankIndicator';

dayjs.extend(relativeTime);

export const Players = ({
  replays,
  playerNamesMap
}: {
  replays: Replay1v1[];
  playerNamesMap: PlayerNamesMap;
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    const fetch = async () => {
      setIsLoading(true);

      const settings = await GetSettings();
      const parsedPlayers = await playersParser(replays);
      const apiPlayers = (await SearchPlayerInApi('')) || [];

      if (!settings.playerInfoSharingDisabled) {
        setPlayers(mergeWithApiPlayers(parsedPlayers, apiPlayers));
      } else {
        setPlayers(
          parsedPlayers.map((player) => ({
            ...player,
            ranks: player.history.map((history) => history.enemyRank)
          }))
        );
      }

      setIsLoading(false);

      if (settings.playerInfoSharingDisabled || !players.length) return;

      SendUsersToAPI(
        players.map((player) => {
          const sortedHistory = [...player.history].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const newest = sortedHistory[0];
          const oldest = sortedHistory[sortedHistory.length - 1];

          return {
            usernames: playerNamesMap.getNames(player.id),
            ranks: player.history.map((history) => parseInt(history.enemyRank)),
            eugenId: parseInt(player.id),
            lastKnownRank: newest ? parseInt(newest.enemyRank) : undefined,
            lastKnownRankCreatedAt: newest ? dayjs(newest.createdAt).toISOString() : undefined,
            oldestReplayCreatedAt: oldest ? dayjs(oldest.createdAt).toISOString() : undefined
          };
        }) as main.PostUser[]
      );
    };

    fetch();
  }, [players.length, replays.length]);

  const handleApiSearch = async (query: string) => {
    const apiPlayers = (await SearchPlayerInApi(query)) || [];

    setPlayers((prevPlayers) => {
      const newPlayers = apiPlayers
        .filter(
          (apiPlayer) => !prevPlayers.some((player) => player.id === apiPlayer.eugenId.toString())
        )
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
                      <div className="flex gap-1 items-center">
                        {player.api && <ApiOutlined />}
                        <Typography.Text strong>
                          {playerNamesMap.getNames(player.id).join(', ')}
                        </Typography.Text>
                      </div>
                    }
                    description={<RankIndicator player={player} rankMinMax={rankMinMax} />}
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
