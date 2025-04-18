import { useEffect, useState } from 'react';
import './App.css';
import { GetAppVersions, GetReplays } from '../wailsjs/go/main/App';
import { Button, Card, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { replaysParser, Replay, EugenUser } from './parsers/replaysParser';
import { getStats, Statistics } from './stats';
import { ReplaysTable } from './components/ReplaysTable';
import { Stats } from './components/Statistics';
import { DirectoriesSelect } from './components/DirectoriesSelect';
import { Players } from './components/Players';
import { LinkOutlined, SettingOutlined } from '@ant-design/icons';
import { SettingsDrawer } from './drawers/SettingsDrawer';
import { versionOutdated } from './helpers/version';
import { DailyRecap } from './components/DailyRecap';

dayjs.extend(relativeTime);

function App() {
  const [directories, setDirectories] = useState<string[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [stats, setStats] = useState<Statistics>();
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [versions, setVersions] = useState<[string, string]>();
  const [eugenUsers, setEugenUsers] = useState<EugenUser[]>();

  useEffect(() => {
    const fetchAppVersions = async (): Promise<void> => {
      const [appVersion, latestVersion] = await GetAppVersions();

      setVersions([appVersion, latestVersion]);
    };

    fetchAppVersions();
  }, []);

  const run = async () => {
    setLoading(true);
    setReplays([]);
    setStats(undefined);

    try {
      const data = await GetReplays(directories);
      const { replays, eugenUsers } = await replaysParser(data);
      const sortedReplays = replays.sort(
        (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()
      );

      setEugenUsers(eugenUsers);

      setReplays(sortedReplays);
      setStats(getStats(sortedReplays));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">WARNO Replays Analyser</div>
            {versions && versionOutdated(...versions) ? (
              <Tag>
                <div className="flex items-center">
                  New version available: {versions[1]}
                  <Button
                    type="link"
                    size="small"
                    href="https://github.com/Kraku/warno-replays-analyser/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<LinkOutlined />}
                  />
                </div>
              </Tag>
            ) : null}
          </div>

          <Button icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>
            Settings
          </Button>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <DirectoriesSelect directories={directories} setDirectories={setDirectories} />
            <Button
              type="primary"
              onClick={run}
              disabled={loading || directories.length === 0}
              loading={loading}>
              {loading ? 'Loading' : replays.length === 0 ? 'Generate' : 'Refresh'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {replays.length > 0 && eugenUsers ? <DailyRecap eugenUsers={eugenUsers} /> : null}
            <Card
              tabList={[
                {
                  key: '1',
                  label: 'Summary',
                  children: (
                    <div className="pt-4 mb-10">
                      <ReplaysTable replays={replays} />
                    </div>
                  )
                },
                {
                  key: '2',
                  label: 'Players',
                  children: (
                    <div className="pt-4 mb-10">{stats ? <Players replays={replays} /> : null}</div>
                  )
                },
                {
                  key: '3',
                  label: 'Statistics',
                  children: (
                    <div className="pt-4 mb-10">{stats ? <Stats stats={stats} /> : null}</div>
                  )
                }
              ]}
              styles={{
                body: { padding: 0 }
              }}
            />
          </div>
        )}
      </div>

      {showSettings ? (
        <SettingsDrawer
          onClose={() => setShowSettings(false)}
          onSave={() => {
            run();
            setShowSettings(false);
          }}
        />
      ) : null}
    </>
  );
}

export default App;
