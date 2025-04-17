import { Replay } from './replaysParser';

export type PlayerHistory = {
  result: 'Victory' | 'Defeat' | 'Draw';
  division: string;
  enemyDivision: string;
  enemyDeck: string;
  createdAt: string;
  duration: number;
  map: string;
  enemyRank: string;
};

export type Player = {
  id: string;
  names: string[];
  history: PlayerHistory[];
};

export const playersParser = async (replays: Replay[]): Promise<Player[]> => {
  const playersMap: Map<string, Player> = new Map();

  for (const replay of replays) {
    const existingPlayer = playersMap.get(replay.enemyId);

    if (existingPlayer) {
      if (!existingPlayer.names.includes(replay.enemyName)) {
        existingPlayer.names.push(replay.enemyName);
      }

      existingPlayer.history.push({
        result: replay.result,
        division: replay.division,
        enemyDivision: replay.enemyDivision,
        enemyDeck: replay.enemyDeck,
        createdAt: replay.createdAt,
        duration: replay.duration,
        map: replay.map,
        enemyRank: replay.enemyRank
      });
    } else {
      const player: Player = {
        id: replay.enemyId,
        names: [replay.enemyName],
        history: [
          {
            result: replay.result,
            division: replay.division,
            enemyDivision: replay.enemyDivision,
            enemyDeck: replay.enemyDeck,
            createdAt: replay.createdAt,
            duration: replay.duration,
            map: replay.map,
            enemyRank: replay.enemyRank
          }
        ]
      };

      playersMap.set(replay.enemyId, player);
    }
  }

  return Array.from(playersMap.values());
};
