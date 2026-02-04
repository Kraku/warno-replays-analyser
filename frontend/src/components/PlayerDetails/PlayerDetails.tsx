import { Player } from '../../parsers/playersParser';
import { Card, Typography, Tag, Descriptions, Avatar, Spin, Popover } from 'antd';
import { useEffect, useState } from 'react';
import { GetEugenPlayer, GetSteamPlayer } from '../../../wailsjs/go/main/App';
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
import { Replay1v1 } from '../../parsers/replaysParser';

dayjs.extend(relativeTime);

const getRankedWinrate = (eugenPlayer?: main.EugenPlayer) => {
  if (!eugenPlayer) return <span>N/A</span>;

  const wins = Number(eugenPlayer.ranked_win) || 0;
  const losses = Number(eugenPlayer.ranked_loss) || 0;
  const fouls = Number(eugenPlayer.ranked_foul) || 0;

  const totalGames = wins + losses + fouls;
  if (totalGames === 0) return <span>N/A</span>;

  const winrate = ((wins / totalGames) * 100).toFixed(0);

  return (
    <div className="flex items-center gap-1">
      <span className="text-green-600">{wins}</span>/<span className="text-red-600 ">{losses}</span>
      <span className="text-neutral-400">({winrate}%)</span>
    </div>
  );
};

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
  playerNamesMap,
  allReplays
}: {
  player: Player;
  playerNamesMap: PlayerNamesMap;
  allReplays?: Replay1v1[];
}) => {
  const [steamPlayer, setSteamPlayer] = useState<main.SteamPlayer>();
  const [eugenPlayer, setEugenPlayer] = useState<main.EugenPlayer>();
  const [isSteamPlayerLoading, setSteamPlayerLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetcSteamData = async () => {
      setSteamPlayerLoading(true);
      const steamPlayer = player.steamId ? await GetSteamPlayer(player.steamId) : undefined;
      const eugenPlayer = await GetEugenPlayer(player.id);

      setSteamPlayer(steamPlayer);
      setEugenPlayer(eugenPlayer);
      setSteamPlayerLoading(false);
    };

    fetcSteamData();
  }, [player.steamId, player.id]);

  const rankMinMax = getMinMax(player.ranks.flatMap((ranks) => parseInt(ranks)));
  const names = playerNamesMap.getNames(player.id);
  const primaryName = playerNamesMap.getPlayerCommonName(player.id);
  const otherNames = names.filter((n) => n !== primaryName);

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

            <div className="max-w-xl truncate flex items-center gap-2">
              <span>{primaryName}</span>
              {otherNames.length > 0 ? (
                <Popover
                  placement="bottom"
                  content={
                    <div className="max-w-md">
                      <Typography.Text type="secondary">Also seen as:</Typography.Text>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {otherNames.slice(0, 20).map((n) => (
                          <Tag key={n} bordered={false}>
                            {n}
                          </Tag>
                        ))}
                        {otherNames.length > 20 ? (
                          <Tag bordered={false}>+{otherNames.length - 20} more</Tag>
                        ) : null}
                      </div>
                    </div>
                  }>
                  <Tag bordered={false}>{otherNames.length + 1} names</Tag>
                </Popover>
              ) : null}
            </div>

            <RankIndicator
              rankMinMax={rankMinMax}
              rank={parseInt(eugenPlayer?.ELO_LB_rank ?? '0')}
              delta={parseInt(eugenPlayer?.ELO_LB_delta_rank ?? '0')}
            />
            <Tag bordered={false}>#{player?.id}</Tag>
          </div>
        </div>
      }>
      <div>
        <Descriptions
          rootClassName="mb-4"
          column={5}
          size="small"
          items={[
            {
              key: '2',
              label: 'Last Seen',
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
              key: 'games',
              label: 'Ranked Games',
              children: getRankedWinrate(eugenPlayer)
            },
            {
              key: 'elo',
              label: 'ELO',
              children: eugenPlayer ? (
                <div className="flex flex-col gap-1">
                  {parseInt(eugenPlayer.ELO)} ({parseInt(eugenPlayer.ELO_LB_delta_value)})
                </div>
              ) : (
                'N/A'
              )
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
