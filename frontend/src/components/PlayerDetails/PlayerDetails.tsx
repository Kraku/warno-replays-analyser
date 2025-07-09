import { Player } from '../../parsers/playersParser';
import { Card, Typography, Tag, Descriptions, Avatar, Spin } from 'antd';
import { useEffect, useState } from 'react';
import {  GetSteamPlayer } from '../../../wailsjs/go/main/App';
import { OurGamesTable } from './OurGamesTable';
import { PlayerNotes } from './PlayerNotes';
import { PlayerNamesMap } from '../../helpers/playerNamesMap';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RankIndicator } from '../RankIndicator';
import { main } from '../../../wailsjs/go/models';
import ReactCountryFlag from 'react-country-flag';
import { getMinMax } from '../../helpers/getMinMax';
import { Divisions } from './Divisions';

dayjs.extend(relativeTime);

const getPersonaStateLabel = (steamPlayer?: main.SteamPlayer) => {
  switch (steamPlayer?.personastate) {
    case 0:
      return 'Offline';
    case 1:
      return (
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          Online
          {steamPlayer.gameextrainfo === 'WARNO' && (
            <Tag color="green" bordered={false}>
              WARNO
            </Tag>
          )}
        </div>
      );
    case 2:
      return 'Busy';
    case 3:
      return 'Away';
    case 4:
      return 'Snooze';
    default:
      return 'Unknown';
  }
};

export const PlayerDetails = ({
  player,
  playerNamesMap
}: {
  player: Player;
  playerNamesMap: PlayerNamesMap;
}) => {
  const [steamPlayer, setSteamPlayer] = useState<main.SteamPlayer>();
  const [isSteamPlayerLoading, setSteamPlayerLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetcSteamData = async () => {
      setSteamPlayerLoading(true);
      const steamPlayer = await GetSteamPlayer(player.steamId);

      setSteamPlayer(steamPlayer);
      setSteamPlayerLoading(false);
    };

    fetcSteamData();
  }, [player.steamId]);

  const rankMinMax = getMinMax(player.ranks.flatMap((ranks) => parseInt(ranks)));

  return (
    <Card
      title={
        <div className="flex gap-2 items-center mb-2">
          <div className="flex items-center justify-center w-10 h-10">
            {isSteamPlayerLoading ? <Spin /> : <Avatar src={steamPlayer?.avatarmedium} size={38} />}
          </div>

          <div className="flex gap-2 items-center">
            {steamPlayer?.loccountrycode ? (
              <ReactCountryFlag countryCode={steamPlayer.loccountrycode} svg />
            ) : null}

            <div className="max-w-[80%] truncate">
              {playerNamesMap.getNames(player.id).join(', ')}
            </div>

            <RankIndicator player={player} rankMinMax={rankMinMax} />
            <Tag bordered={false}>#{player?.id}</Tag>
          </div>
        </div>
      }>
      <div>
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
            },
            {
              key: '4',
              label: 'Steam',
              children: isSteamPlayerLoading ? (
                <Spin size="small" />
              ) : (
                getPersonaStateLabel(steamPlayer)
              )
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

        <Typography.Title level={5} className="mb-2">
          Divisions
        </Typography.Title>

        <Divisions playerId={player.id} />

        <PlayerNotes player={player} />
      </div>
    </Card>
  );
};
