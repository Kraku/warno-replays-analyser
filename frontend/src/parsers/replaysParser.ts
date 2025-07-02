import {
  decodeDeckString,
  GenericLookupAdapter,
  GenericLookupAdapterObject
} from '@izohek/warno-deck-utils';

import units from '../data/units.json' assert { type: 'json' };
import divisions from '../data/divisions.json' assert { type: 'json' };
import maps from '../data/maps.json' assert { type: 'json' };
import { GetSettings } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { PlayerNamesMap } from '../helpers/playerNamesMap';
import { expectedEloChange } from '../helpers/expectedEloChange';

const typedUnits: GenericLookupAdapterObject[] = units as GenericLookupAdapterObject[];
const typedDivisions: GenericLookupAdapterObject[] = divisions as GenericLookupAdapterObject[];
const typedMaps: Record<string, string> = maps as Record<string, string>;

export type Replay1v1 = CommonReplayData & {
  enemyName: string;
  enemyId: string;
  enemyDivision: string;
  enemyRank: string;
  enemyDeck: string;
  enemyElo: string;
  playerElo: string;
  eloChange: number;
};

export type Replay2v2 = CommonReplayData & {
  allyData: PlayerData;
  enemiesData: PlayerData[];
};

export type EugenUser = {
  eugenId: string;
  playerNames: string[];
};

export type CommonReplayData = {
  createdAt: string;
  fileName: string;
  filePath: string;
  playerId: string;
  playerName: string;
  rank: string;
  division: string;
  deck: string;
  duration: number;
  map: string;
  result: 'Victory' | 'Defeat' | 'Draw';
};

type PlayerData = {
  playerId: string;
  playerName: string;
  playerDivision: string;
  playerRank: string;
  playerDeck: string;
};

type ParserResult = {
  replays1v1: Replay1v1[];
  replays2v2: Replay2v2[];
  playerNamesMap: PlayerNamesMap;
  eugenUsers: EugenUser[];
};

const lookup = new GenericLookupAdapter(typedUnits, typedDivisions);

export const getDivisionName = (code: string) => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;

  return divisions.find((division) => division.id === id)?.name || 'Unknown';
};

export const replaysParser = async (data: main.WarnoData[]): Promise<ParserResult> => {
  const settings = await GetSettings();
  const eugenUsers: EugenUser[] = [];
  const playerNamesMap = new PlayerNamesMap();
  const replays1v1: Replay1v1[] = [];
  const replays2v2: Replay2v2[] = [];

  data.forEach((replay: any) => {
    const players = Object.entries(replay.warno.players) ?? {};
    const playerKey = replay.warno.localPlayerKey;
    const playerId = replay.warno.localPlayerEugenId;

    if (settings.startDate && new Date(replay.createdAt) < new Date(settings.startDate)) {
      return;
    }

    if (
      playerKey.length == 0 ||
      (settings.playerIds &&
        !settings.playerIds?.includes(replay.warno.players?.[playerKey]?.PlayerUserId))
    ) {
      return;
    }

    const eugenUserIndex = eugenUsers.findIndex(
      (user) => user.eugenId === replay.warno.players?.[playerKey].PlayerUserId
    );

    if (eugenUserIndex === -1) {
      eugenUsers.push({
        eugenId: replay.warno.players?.[playerKey].PlayerUserId,
        playerNames: [replay.warno.players?.[playerKey].PlayerName]
      });
    } else if (
      !eugenUsers[eugenUserIndex].playerNames.includes(replay.warno.players?.[playerKey].PlayerName)
    ) {
      eugenUsers[eugenUserIndex].playerNames.push(replay.warno.players?.[playerKey].PlayerName);
    }

    const result = ['4', '5', '6'].includes(replay.warno.result.Victory)
      ? 'Victory'
      : ['0', '1', '2'].includes(replay.warno.result.Victory)
      ? 'Defeat'
      : 'Draw';

    const commonReplayData: CommonReplayData = {
      createdAt: replay.createdAt,
      fileName: replay.fileName,
      filePath: replay.filePath,
      playerId: playerId,
      playerName: replay.warno.players?.[playerKey].PlayerName,
      rank: replay.warno.players?.[playerKey].PlayerRank,
      deck: replay.warno.players?.[playerKey].PlayerDeckContent,
      division: getDivisionName(replay.warno.players?.[playerKey].PlayerDeckContent),
      duration: parseInt(replay.warno.result.Duration),
      map: typedMaps[replay.warno.game.Map] || replay.warno.game.Map,
      result
    };

    if (replay.warno.playerCount == 2) {
      const enemyKey = Object.entries(replay.warno.players).find(
        ([key, _]) => key != playerKey
      )?.[0];
      if (!enemyKey) {
        return;
      }

      playerNamesMap.incrementPlayerNameCount(
        replay.warno.players[enemyKey].PlayerUserId,
        replay.warno.players[enemyKey].PlayerName
      );

      replays1v1.push({
        ...commonReplayData,
        playerElo: replay.warno.players?.[playerKey].PlayerElo,
        enemyName: replay.warno.players[enemyKey].PlayerName,
        enemyId: replay.warno.players[enemyKey].PlayerUserId,
        enemyDivision: getDivisionName(replay.warno.players?.[enemyKey].PlayerDeckContent),
        enemyRank: replay.warno.players[enemyKey].PlayerRank,
        enemyDeck: replay.warno.players?.[enemyKey]?.PlayerDeckContent,
        enemyElo: replay.warno.players?.[enemyKey]?.PlayerElo,
        eloChange: expectedEloChange(
          parseInt(replay.warno.players?.[playerKey].PlayerElo),
          parseInt(replay.warno.players?.[enemyKey].PlayerElo),
          result === 'Victory' ? 1 : result === 'Defeat' ? 0 : 0.5
        )
      });
    } else if (replay.warno.playerCount == 4) {
      const allies: PlayerData[] = [];
      const enemies: PlayerData[] = [];
      const playerAlliance = replay.warno.players?.[playerKey].PlayerAlliance;

      for (const [key, player] of players as [string, any][]) {
        if (key === playerKey) {
          continue;
        }

        const playerData: PlayerData = {
          playerName: player.PlayerName,
          playerId: player.PlayerUserId,
          playerDivision: getDivisionName(player.PlayerDeckContent),
          playerRank: player.PlayerRank,
          playerDeck: player.PlayerDeckContent
        };

        playerNamesMap.incrementPlayerNameCount(player.PlayerUserId, player.PlayerName);

        if (player.PlayerAlliance === playerAlliance) {
          allies.push(playerData);
        } else {
          enemies.push(playerData);
        }
      }

      if (allies.length == 1 && enemies.length == 2) {
        playerNamesMap.incrementPlayerNameCount(allies[0].playerId, allies[0].playerName);
        enemies.forEach((enemy) => {
          playerNamesMap.incrementPlayerNameCount(enemy.playerId, enemy.playerName);
        });

        replays2v2.push({
          ...commonReplayData,
          allyData: allies[0],
          enemiesData: enemies
        });
      }
    }
  });

  return {
    replays1v1: replays1v1,
    replays2v2: replays2v2,
    playerNamesMap,
    eugenUsers
  };
};
