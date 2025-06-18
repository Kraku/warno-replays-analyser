import { Player } from '../../parsers/playersParser';
import { Card, Typography, Tag, Descriptions } from 'antd';
import { useEffect, useState } from 'react';
import { main } from '../../../wailsjs/go/models';
import { GetPlayerGameHistory } from '../../../wailsjs/go/main/App';
import { OurGamesTable } from './OurGamesTable';
import { getMinMax } from '../../helpers/getMinMax';
import { PlayerNotes } from './PlayerNotes';
import { PlayerNamesMap } from '../../helpers/playerNamesMap';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RankIndicator } from '../RankIndicator';

dayjs.extend(relativeTime);

export const PlayerDetails = ({
  player,
  playerNamesMap
}: {
  player: Player;
  playerNamesMap: PlayerNamesMap;
}) => {
  const [globalHistory, setGlobalHistory] = useState<main.PlayerGame[]>([]);
  const [isGlobalHistoryLoading, setIsGlobalHistoryLoading] = useState(true);

  useEffect(() => {
    setGlobalHistory([]);

    const fetchPlayers = async () => {
      const data = await GetPlayerGameHistory(player.id);

      setGlobalHistory(data.filter(({ enemyName }) => enemyName));
      setIsGlobalHistoryLoading(false);
    };

    setIsGlobalHistoryLoading(true);
    fetchPlayers();
  }, [player.id]);

  const rankMinMax = getMinMax(player.ranks.flatMap((ranks) => parseInt(ranks)));

  return (
    <Card
      title={
        <div className="flex gap-2 items-center mb-2">
          <div className="max-w-[80%] truncate">
            {playerNamesMap.getNames(player.id).join(', ')}
          </div>

          <RankIndicator player={player} rankMinMax={rankMinMax} />
          <Tag bordered={false}>#{player?.id}</Tag>
        </div>
      }>
      <div>
        {/* <Typography.Title level={5} className="mb-2">
          Games History<span className="text-xs text-neutral-400 ml-2">(last 10)</span>
        </Typography.Title>

        <GamesTable history={globalHistory} isLoading={isGlobalHistoryLoading} /> */}
        <Descriptions
          rootClassName="mb-4"
          items={[
            {
              key: '2',
              label: 'Age of Last Known Rank',
              children: player.lastKnownRankCreatedAt
                ? dayjs(player.lastKnownRankCreatedAt).fromNow(true)
                : 'N/A'
            },
            {
              key: '3',
              label: 'First Seen',
              children: player.oldestReplayCreatedAt
                ? dayjs(player.oldestReplayCreatedAt).fromNow()
                : 'N/A'
            }
          ]}
        />

        <Typography.Title level={5} className="mb-2">
          Our Games History
          <span className="text-xs text-neutral-400 ml-2">
            {player.history.length > 0
              ? `${player.history.filter((game) => game.result === 'Victory').length}/${
                  player.history.length
                } (${(
                  (player.history.filter((game) => game.result === 'Victory').length /
                    player.history.length) *
                  100
                ).toFixed(1)}%)`
              : ''}
          </span>
        </Typography.Title>

        <OurGamesTable history={player.history} />

        <PlayerNotes player={player} />
      </div>
    </Card>
  );
};
