import { createContext, useContext, useState } from 'react';
import dayjs from 'dayjs';
import {
  GetReplays,
  GetSettings,
  GetRankedReplaysAnalytics,
  SendRankedReplaysToAPI
} from '../../wailsjs/go/main/App';
import {
  replaysParser,
  Replay,
  EugenUser,
  getDivisionId
} from '../parsers/replaysParser';
import { getStats, Statistics } from '../stats';
import { PlayerNamesMap } from '../helpers/playerNamesMap';
import { main } from '../../wailsjs/go/models';

interface ReplayContextType {
  directories: string[];
  setDirectories: (dirs: string[]) => void;
  replays: Replay[];
  stats?: Statistics;
  playerNamesMap: PlayerNamesMap;
  eugenUsers?: EugenUser[];
  loading: boolean;
  refresh: () => void;
  refreshStats: () => void;
}

const ReplayContext = createContext<ReplayContextType | undefined>(undefined);

export const useReplayContext = () => {
  const context = useContext(ReplayContext);
  if (!context) throw new Error('useReplayContext must be used within ReplayProvider');
  return context;
};

export const ReplayProvider = ({ children }: { children: React.ReactNode }) => {
  const [directories, setDirectories] = useState<string[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [stats, setStats] = useState<Statistics>();
  const [loading, setLoading] = useState(false);
  const [eugenUsers, setEugenUsers] = useState<EugenUser[]>();
  const [playerNamesMap, setPlayerNamesMap] = useState<PlayerNamesMap>(new PlayerNamesMap());

  const fetchAndParseReplays = async () => {
    const data = await GetReplays(directories);
    const replays = await replaysParser(data);

    replays.replays = sortReplaysByDate(replays.replays);

    return replays;
  };

  const sortReplaysByDate = <T extends { createdAt: string }>(replays: T[]): T[] => {
    return replays.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());
  };

  const updateStateWithReplays = async (
    replays: Replay[],
    playerMap: PlayerNamesMap,
    users: EugenUser[]
  ) => {
    setReplays(replays);
    setPlayerNamesMap(playerMap);
    setEugenUsers(users);
    setStats(await getStats(replays));
  };

  const buildRankedReplayInputs = (replays: Replay[]): main.RankedReplayInput[] => {
    return replays
      .map((replay) => {
        const player1EugenId = Number.parseInt(replay.playerId, 10);
        const player2EugenId = Number.parseInt(replay.enemyId, 10);

        if (!Number.isFinite(player1EugenId) || !Number.isFinite(player2EugenId)) {
          return null;
        }

        if (player1EugenId === player2EugenId) {
          return null;
        }

        const player1Division = getDivisionId(replay.deck);
        const player2Division = getDivisionId(replay.enemyDeck);

        if (!player1Division || !player2Division) {
          return null;
        }

        const mapKey = (replay.mapKey || '').trim();
        if (!mapKey) {
          return null;
        }

        const duration = Number.isFinite(replay.duration) ? replay.duration : 0;
        if (!duration || duration <= 0) {
          return null;
        }

        const player1EloRaw = Number.parseInt(replay.playerElo, 10);
        const player2EloRaw = Number.parseInt(replay.enemyElo, 10);
        const player1RankRaw = Number.parseInt(replay.rank, 10);
        const player2RankRaw = Number.parseInt(replay.enemyRank, 10);

        const player1Elo = Number.isFinite(player1EloRaw) && player1EloRaw > 0 ? player1EloRaw : undefined;
        const player2Elo = Number.isFinite(player2EloRaw) && player2EloRaw > 0 ? player2EloRaw : undefined;
        const player1Rank = Number.isFinite(player1RankRaw) && player1RankRaw > 0 ? player1RankRaw : undefined;
        const player2Rank = Number.isFinite(player2RankRaw) && player2RankRaw > 0 ? player2RankRaw : undefined;

        const eugen_id = (replay.id || '').trim();

        let winnerPlayerEugenId: number | null = null;
        if (replay.result === 'Victory') {
          winnerPlayerEugenId = player1EugenId;
        } else if (replay.result === 'Defeat') {
          winnerPlayerEugenId = player2EugenId;
        } else {
          winnerPlayerEugenId = null;
        }

        const playedAt = dayjs(replay.createdAt).isValid()
          ? dayjs(replay.createdAt).toISOString()
          : undefined;

        const player1Name = (replay.playerName || '').trim();
        const player2Name = (replay.enemyName || '').trim();

        if (!player1Name || !player2Name) {
          return null;
        }

        if (player1Name === 'Unknown' || player2Name === 'Unknown') {
          return null;
        }

        return {
          eugenId: eugen_id.length > 0 ? eugen_id : undefined,
          player1EugenId,
          player2EugenId,
          player1Elo,
          player1Rank,
          player2Elo,
          player2Rank,
          player1Name,
          player2Name,
          player1Division,
          player2Division,
          map: mapKey,
          duration,
          winnerPlayerEugenId,
          submittedByEugenId: player1EugenId,
          playedAt
        };
      })
      .filter(Boolean) as main.RankedReplayInput[];
  };

  const sendRankedReplaysIfEnabled = async (replays: Replay[]) => {
    try {
      const rankedReplays = buildRankedReplayInputs(replays);

      await SendRankedReplaysToAPI(rankedReplays);
      await GetRankedReplaysAnalytics(0, 0);
    } catch (error) {
      console.error('Error sending ranked replays to API:', error);
    }
  };

  const refresh = async () => {
    setLoading(true);
    clearReplayData();

    try {
      const { replays, playerNamesMap, eugenUsers } = await fetchAndParseReplays();

      void sendRankedReplaysIfEnabled(replays);

      await updateStateWithReplays(replays, playerNamesMap, eugenUsers);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setLoading(true);
    const replays = await fetchAndParseReplays();

    setStats(await getStats(replays.replays));
    setLoading(false);
  };

  const clearReplayData = () => {
    setReplays([]);
    setStats(undefined);
  };

  return (
    <ReplayContext.Provider
      value={{
        directories,
        setDirectories,
        replays,
        stats,
        playerNamesMap,
        eugenUsers,
        loading,
        refresh,
        refreshStats
      }}>
      {children}
    </ReplayContext.Provider>
  );
};
