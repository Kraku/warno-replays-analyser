import { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { GetReplays, GetSettings, SaveSettings } from '../../wailsjs/go/main/App';
import { replaysParser, Replay1v1, Replay2v2, EugenUser } from '../parsers/replaysParser';
import { getStats1v1, getStats2v2, Statistics1v1, Statistics2v2 } from '../stats';
import { PlayerNamesMap } from '../helpers/playerNamesMap';

interface ReplayContextType {
  directories: string[];
  setDirectories: (dirs: string[]) => void;
  replays1v1: Replay1v1[];
  replays2v2: Replay2v2[];
  stats1v1?: Statistics1v1;
  stats2v2?: Statistics2v2;
  playerNamesMap: PlayerNamesMap;
  eugenUsers?: EugenUser[];
  loading: boolean;
  gameMode: string;
  setGameMode: (mode: string) => void;
  refresh: () => void;
  refresh1v1Stats: () => void;
}

const ReplayContext = createContext<ReplayContextType | undefined>(undefined);

export const useReplayContext = () => {
  const context = useContext(ReplayContext);
  if (!context) throw new Error('useReplayContext must be used within ReplayProvider');
  return context;
};

export const ReplayProvider = ({ children }: { children: React.ReactNode }) => {
  const [directories, setDirectories] = useState<string[]>([]);
  const [replays1v1, setReplays1v1] = useState<Replay1v1[]>([]);
  const [replays2v2, setReplays2v2] = useState<Replay2v2[]>([]);
  const [stats1v1, setStats1v1] = useState<Statistics1v1>();
  const [stats2v2, setStats2v2] = useState<Statistics2v2>();
  const [loading, setLoading] = useState(false);
  const [eugenUsers, setEugenUsers] = useState<EugenUser[]>();
  const [playerNamesMap, setPlayerNamesMap] = useState<PlayerNamesMap>(new PlayerNamesMap());
  const [gameMode, setGameMode] = useState<string>('1v1');

  useEffect(() => {
    GetSettings().then((settings) => {
      setGameMode(settings.gameMode || '1v1');
    });
  }, []);

  const fetchAndParseReplays = async () => {
    const data = await GetReplays(directories);
    const replays = await replaysParser(data);

    replays.replays1v1 = sortReplaysByDate(replays.replays1v1);
    replays.replays2v2 = sortReplaysByDate(replays.replays2v2);

    return replays;
  };

  const sortReplaysByDate = <T extends { createdAt: string }>(replays: T[]): T[] => {
    return replays.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());
  };

  const updateStateWithReplays = async (
    replays1v1: Replay1v1[],
    replays2v2: Replay2v2[],
    playerMap: PlayerNamesMap,
    users: EugenUser[]
  ) => {
    setReplays1v1(replays1v1);
    setReplays2v2(replays2v2);
    setPlayerNamesMap(playerMap);
    setEugenUsers(users);
    setStats1v1(await getStats1v1(replays1v1));
    setStats2v2(getStats2v2(replays2v2, playerMap));
  };

  const refresh = async () => {
    setLoading(true);
    clearReplayData();

    try {
      const { replays1v1, replays2v2, playerNamesMap, eugenUsers } = await fetchAndParseReplays();

      await updateStateWithReplays(replays1v1, replays2v2, playerNamesMap, eugenUsers);
    } finally {
      setLoading(false);
    }
  };

  const refresh1v1Stats = async () => {
    setLoading(true);
    const replays = await fetchAndParseReplays();

    setStats1v1(await getStats1v1(replays.replays1v1));
    setLoading(false);
  };

  const clearReplayData = () => {
    setReplays1v1([]);
    setReplays2v2([]);
    setStats1v1(undefined);
    setStats2v2(undefined);
  };

  const handleSetGameMode = async (value: string) => {
    setGameMode(value);

    const settings = await GetSettings();

    SaveSettings({ ...settings, gameMode: value });
  };

  return (
    <ReplayContext.Provider
      value={{
        directories,
        setDirectories,
        replays1v1,
        replays2v2,
        stats1v1,
        stats2v2,
        playerNamesMap,
        eugenUsers,
        loading,
        gameMode,
        setGameMode: handleSetGameMode,
        refresh,
        refresh1v1Stats
      }}>
      {children}
    </ReplayContext.Provider>
  );
};
