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
const typedDivisions: GenericLookupAdapterObject[] = (divisions as any[]).map((division) => ({
  id: division.id,
  descriptor: division.name
}));
const typedMaps: Record<string, string> = maps as Record<string, string>;

export type Replay = CommonReplayData & {
  enemyName: string;
  enemyId: string;
  enemyDivision: string;
  enemyRank: string;
  enemyDeck: string;
  enemyElo: string;
  playerElo: string;
  eloChange: number;
  enemySteamId?: string;
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
  mapKey: string;
  map: string;
  id: string;
  result: 'Victory' | 'Defeat' | 'Draw';
};

type ParserResult = {
  replays: Replay[];
  playerNamesMap: PlayerNamesMap;
  eugenUsers: EugenUser[];
};

const lookup = new GenericLookupAdapter(typedUnits, typedDivisions);

export const getDivisionName = (code: string) => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;

  if (id && !divisions.find((division) => division.id === id)) {
    console.warn(`Unknown division id: ${id}`, code);
  }

  return divisions.find((division) => division.id === id)?.name || 'Unknown';
};

export const getDivisionId = (code: string): number | null => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;
  return typeof id === 'number' && id > 0 ? id : null;
};

export const replaysParser = async (data: main.WarnoData[]): Promise<ParserResult> => {
  const settings = await GetSettings();
  const eugenUsers: EugenUser[] = [];
  const playerNamesMap = new PlayerNamesMap();
  const replays: Replay[] = [];

  data.forEach((replay: main.WarnoData) => {
    const playerKey = replay.warno.localPlayerKey;
    const playerId = replay.warno.localPlayerEugenId;

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
      mapKey: replay.warno.game.Map,
      map: typedMaps[replay.warno.game.Map] || replay.warno.game.Map,
      id: replay.warno.game.UniqueSessionId,
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

      replays.push({
        ...commonReplayData,
        playerElo: replay.warno.players?.[playerKey].PlayerElo,
        enemyName: replay.warno.players[enemyKey].PlayerName,
        enemyId: replay.warno.players[enemyKey].PlayerUserId,
        enemyDivision: getDivisionName(replay.warno.players?.[enemyKey].PlayerDeckContent),
        enemyRank: replay.warno.players[enemyKey].PlayerRank,
        enemyDeck: replay.warno.players?.[enemyKey]?.PlayerDeckContent,
        enemyElo: replay.warno.players?.[enemyKey]?.PlayerElo,
        enemySteamId: replay.warno.players?.[enemyKey]?.PlayerAvatar.split('/').pop(),
        eloChange: expectedEloChange(
          parseInt(replay.warno.players?.[playerKey].PlayerElo),
          parseInt(replay.warno.players?.[enemyKey].PlayerElo),
          result === 'Victory' ? 1 : result === 'Defeat' ? 0 : 0.5
        )
      });
    }
  });

  return {
    replays: replays,
    playerNamesMap,
    eugenUsers
  };
};
