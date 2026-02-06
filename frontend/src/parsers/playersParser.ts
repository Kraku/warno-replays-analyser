import { Replay } from './replaysParser';

export type PlayerHistory = {
  filePath: string;
  result: 'Victory' | 'Defeat' | 'Draw';
  division: string;
  rank: string;
  enemyDivision: string;
  enemyDeck: string;
  createdAt: string;
  duration: number;
  map: string;
  enemyRank: string;
  id: string;
};

export type Player = {
  id: string;
  history: PlayerHistory[];
  ranks: string[];
  api: boolean;
  lastKnownRank?: number | null;
  lastKnownRankCreatedAt?: string | null;
  oldestReplayCreatedAt?: string | null;
  steamId: string;
};

const createPlayerHistory = (replay: Replay): PlayerHistory => ({
  filePath: replay.filePath,
  result: replay.result,
  division: replay.division,
  rank: replay.rank,
  enemyDivision: replay.enemyDivision,
  enemyDeck: replay.enemyDeck,
  createdAt: replay.createdAt,
  duration: replay.duration,
  map: replay.map,
  enemyRank: replay.enemyRank,
  id: replay.id
});

const createNewPlayer = (replay: Replay): Player => ({
  id: replay.enemyId,
  ranks: [replay.enemyRank],
  api: false,
  steamId: replay.enemySteamId || '',
  history: [createPlayerHistory(replay)]
});

const updatePlayer = (existingPlayer: Player, replay: Replay): void => {
  existingPlayer.history.push(createPlayerHistory(replay));
};

export const playersParser = async (replays: Replay[]): Promise<Player[]> => {
  const playersMap: Map<string, Player> = new Map();

  replays.forEach((replay) => {
    const existingPlayer = playersMap.get(replay.enemyId);

    if (existingPlayer) {
      updatePlayer(existingPlayer, replay);
    } else {
      const newPlayer = createNewPlayer(replay);
      playersMap.set(replay.enemyId, newPlayer);
    }
  });

  return Array.from(playersMap.values());
};
