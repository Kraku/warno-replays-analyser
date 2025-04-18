import { Player } from '../../parsers/playersParser';
import { Card, Typography, Tag } from 'antd';
import { PlayerNotes } from '../PlayerNotes';
import { useEffect, useState } from 'react';
import { main } from '../../../wailsjs/go/models';
import { GetPlayerGameHistory } from '../../../wailsjs/go/main/App';
import { OurGamesTable } from './OurGamesTable';
import { GamesTable } from './GamesTable';
import { getMinMax } from '../../helpers/getMinMax';

export const PlayerDetails = ({ player }: { player: Player }) => {
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

  const rankMinMax = getMinMax(player.history.flatMap(({ enemyRank }) => parseInt(enemyRank)));

  return (
    <Card
      title={
        <div className="flex gap-2 items-center mb-2">
          <Typography.Text>{player?.names.join(', ')}</Typography.Text>
          {rankMinMax.min ? (
            <div className="flex items-center gap-1">
              <div
                className={[
                  'w-2 h-2 rounded-full mt-0.5',
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

              <Typography.Text type="secondary">
                {rankMinMax.min === rankMinMax.max
                  ? `${rankMinMax.min}`
                  : `${rankMinMax.min} - ${rankMinMax.max}`}
              </Typography.Text>
            </div>
          ) : null}
          <Tag bordered={false}>#{player?.id}</Tag>
        </div>
      }>
      <div>
        <Typography.Title level={5} className="mb-2">
          Games History<span className="text-xs text-neutral-400 ml-2">(last 10)</span>
        </Typography.Title>

        <GamesTable history={globalHistory} isLoading={isGlobalHistoryLoading} />

        <Typography.Title level={5} className="mb-2">
          Our Games History
          <span className="text-xs text-neutral-400 ml-2">
            {`${player.history.filter((game) => game.result === 'Victory').length}/${
              player.history.length
            } (${(
              (player.history.filter((game) => game.result === 'Victory').length /
                player.history.length) *
              100
            ).toFixed(1)}%)`}
          </span>
        </Typography.Title>

        <OurGamesTable history={player.history} />

        <PlayerNotes player={player} />
      </div>
    </Card>
  );
};
