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

const lookup = new GenericLookupAdapter(typedUnits, typedDivisions);

const getDivisionName = (code: string) => {
  const id = code ? decodeDeckString(code, lookup).division.id : null;

  return divisions.find((division) => division.id === id)?.name || 'Unknown';
};

export const replaysParser = async (data: main.WarnoData[]): Promise<Replay[]> => {
  const settings = await GetSettings();

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

      return {
        createdAt: replay.createdAt,
        fileName: replay.fileName,
        playerId: replay.warno.players?.[playerKey].PlayerUserId,
        playerName: replay.warno.players?.[playerKey].PlayerName,
        rank: replay.warno.players?.[playerKey]?.PlayerRank,
        result: ['4', '5', '6'].includes(replay.warno.result.Victory)
          ? 'Victory'
          : ['2'].includes(replay.warno.result.Victory)
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

  return results.filter((replay) => replay !== null) as Replay[];
};
