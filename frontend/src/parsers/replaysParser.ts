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

export type Replay = {
  createdAt: string;
  fileName: string;
  playerId: string;
  playerName: string;
  result: 'Victory' | 'Defeat' | 'Draw';
  rank: string;
  division: string;
  deck: string;
  enemyName: string;
  enemyId: string;
  enemyDivision: string;
  enemyRank: string;
  enemyDeck: string;
  duration: number;
  map: string;
};

export type Replay2v2 = {
  createdAt: string;
  fileName: string;
  playerId: string;
  playerName: string;
  allyId: string;
  allyName: string;
  result: 'Victory' | 'Defeat' | 'Draw';
  division: string;
  deck: string;
  allyDivision: string;
  allyDeck: string;
  enemyName1: string;
  enemyId1: string;
  enemyDivision1: string;
  enemyDeck1: string;
  enemyName2: string;
  enemyId2: string;
  enemyDivision2: string;
  enemyDeck2: string;
  duration: number;
  map: string;
}

export type EugenUser = {
  eugenId: string;
  playerNames: string[];
};

type ParserResult = {
  replays: Replay[];
  eugenUsers: EugenUser[];
};

const lookup = new GenericLookupAdapter(typedUnits, typedDivisions);

const getDivisionName = (code: string) => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;

  return divisions.find((division) => division.id === id)?.name || 'Unknown';
};

export const replaysParser = async (data: main.WarnoData[]): Promise<ParserResult> => {
  const settings = await GetSettings();
  const eugenUsers: EugenUser[] = [];

  const results = await Promise.all(
    data.map(async (replay: any) => {
      const ingamePlayerId = String(replay.warno.ingamePlayerId);
      const playerKey =
        ingamePlayerId === String(replay.warno.players?.player1?.PlayerAlliance)
          ? 'player1'
          : 'player2';
      const enemyKey = playerKey === 'player1' ? 'player2' : 'player1';

      if (
        settings.playerIds &&
        !settings.playerIds.includes(replay.warno.players?.[playerKey].PlayerUserId)
      ) {
        return null;
      }

      if (settings.startDate && new Date(replay.createdAt) < new Date(settings.startDate)) {
        return null;
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

      return {
        createdAt: replay.createdAt,
        fileName: replay.fileName,
        playerId: replay.warno.players?.[playerKey].PlayerUserId,
        playerName: replay.warno.players?.[playerKey].PlayerName,
        rank: replay.warno.players?.[playerKey]?.PlayerRank,
        result: ['4', '5', '6'].includes(replay.warno.result.Victory)
          ? 'Victory'
          : ['1', '2'].includes(replay.warno.result.Victory)
          ? 'Defeat'
          : 'Draw',
        deck: replay.warno.players?.[playerKey]?.PlayerDeckContent,
        division: getDivisionName(replay.warno.players?.[playerKey]?.PlayerDeckContent),
        enemyName: replay.warno.players[enemyKey].PlayerName,
        enemyId: replay.warno.players[enemyKey].PlayerUserId,
        enemyDivision: getDivisionName(replay.warno.players?.[enemyKey]?.PlayerDeckContent),
        enemyRank: replay.warno.players[enemyKey].PlayerRank,
        enemyDeck: replay.warno.players?.[enemyKey]?.PlayerDeckContent,
        duration: parseInt(replay.warno.result.Duration),
        map: typedMaps[replay.warno.game.Map] || replay.warno.game.Map
      };
    })
  );

  return {
    replays: results.filter((replay) => replay !== null) as Replay[],
    eugenUsers
  };
};
