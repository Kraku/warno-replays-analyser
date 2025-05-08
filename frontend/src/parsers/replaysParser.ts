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

const typedUnits: GenericLookupAdapterObject[] = units as GenericLookupAdapterObject[];
const typedDivisions: GenericLookupAdapterObject[] = divisions as GenericLookupAdapterObject[];
const typedMaps: Record<string, string> = maps as Record<string, string>;

export type Replay1v1 = CommonReplayData & {
  enemyName: string;
  enemyId: string;
  enemyDivision: string;
  enemyRank: string;
  enemyDeck: string;
};

export type Replay2v2 = CommonReplayData & {
  allyData: PlayerData,
  enemiesData: PlayerData[];
}

export type EugenUser = {
  eugenId: string;
  playerNames: string[];
};

export type CommonReplayData = {
  createdAt: string;
  fileName: string;
  playerId: string;
  playerName: string;
  rank: string;
  division: string;
  deck: string;
  duration: number;
  map: string;
  result: 'Victory' | 'Defeat' | 'Draw';
}

type PlayerData = {
  playerId: string;
  playerName: string;
  playerDivision: string;
  playerRank: string;
  playerDeck: string;
}

type ParserResult = {
  replays1v1: Replay1v1[];
  replays2v2: Replay2v2[];
  eugenUsers: EugenUser[];
};

const lookup = new GenericLookupAdapter(typedUnits, typedDivisions);

const getDivision = (code: string) => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;

  return divisions.find((division) => division.id === id);
}

const getDivisionName = (code: string) => getDivision(code)?.name ?? 'Unknown';

// may not be necessary if data is in warnodata
const getDivisionAlliance = (code: string) => getDivision(code)?.alliance ?? 'Unknown';

export const replaysParser = async (data: main.WarnoData[]): Promise<ParserResult> => {
  const settings = await GetSettings();
  const eugenUsers: EugenUser[] = [];
  const replays1v1: Replay1v1[] = [];
  const replays2v2: Replay2v2[] = [];

  data.forEach((replay: any) => {
    const ingamePlayerId = String(replay.warno.ingamePlayerId);
    const playerCount = replay.warno.players?.length ?? 0;
    // this may not work for team games
    const playerKeyObject
      = replay.warno.players?.find((player: any) => String(player.PlayerAlliance) === ingamePlayerId) ?? {};
    const playerKey = Object.keys(playerKeyObject)[0];

    if (settings.startDate && new Date(replay.createdAt) < new Date(settings.startDate)) {
      return;
    }

    if (playerKey &&
      settings.playerIds &&
      !settings.playerIds?.includes(replay.warno.players?.[playerKey].PlayerUserId)
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
      !eugenUsers[eugenUserIndex].playerNames.includes(
        replay.warno.players?.[playerKey].PlayerName
      )
    ) {
      eugenUsers[eugenUserIndex].playerNames.push(replay.warno.players?.[playerKey].PlayerName);
    }

    const commonReplayData: CommonReplayData = {
      createdAt: replay.createdAt,
      fileName: replay.fileName,
      playerId: replay.warno.players?.[playerKey].PlayerUserId,
      playerName: replay.warno.players?.[playerKey].PlayerName,
      rank: replay.warno.players?.[playerKey].PlayerRank,
      deck: replay.warno.players?.[playerKey].PlayerDeckContent,
      division: getDivisionName(replay.warno.players?.[playerKey].PlayerDeckContent),
      duration: parseInt(replay.warno.result.Duration),
      map: typedMaps[replay.warno.game.Map] || replay.warno.game.Map,
      result: ['4', '5', '6'].includes(replay.warno.result.Victory)
        ? 'Victory'
        : ['1', '2'].includes(replay.warno.result.Victory)
          ? 'Defeat'
          : 'Draw',
    }

    if (playerCount == 2) {
      const enemyKey = playerKey === 'player1' ? 'player2' : 'player1';
      replays1v1.push({
        ...commonReplayData,
        enemyName: replay.warno.players[enemyKey].PlayerName,
        enemyId: replay.warno.players[enemyKey].PlayerUserId,
        enemyDivision: getDivisionName(replay.warno.players?.[enemyKey].PlayerDeckContent),
        enemyRank: replay.warno.players[enemyKey].PlayerRank,
        enemyDeck: replay.warno.players?.[enemyKey]?.PlayerDeckContent
      });

    } else if (playerCount == 4) {
      let ally: PlayerData | undefined = undefined;
      const enemies: PlayerData[] = [];
      const playerAlliance = getDivisionAlliance(replay.warno.players?.[playerKey].PlayerDeckContent);
      replay.warno.players
        .filter((player: any) => player.PlayerUserId != commonReplayData.playerId)
        .forEach((player: any) => {
          const playerData = {
            playerName: player.PlayerName,
            playerId: player.PlayerUserId,
            playerDivision: getDivisionName(player.PlayerDeckContent),
            playerRank: player.PlayerRank,
            playerDeck: player.PlayerDeckContent
          }

          if (getDivisionAlliance(player.PlayerDeckContent) === playerAlliance) {
            ally = playerData;
          } else {
            enemies.push(playerData);
          }
        });

      if (ally && enemies.length > 0) {
        replays2v2.push({
          ...commonReplayData,
          allyData: ally,
          enemiesData: enemies
        });
      }
    }
  })

  return {
    replays1v1: replays1v1,
    replays2v2: replays2v2,
    eugenUsers
  };
};
