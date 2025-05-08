import { useState } from 'react';
import './App.css';
import { GetReplays } from '../wailsjs/go/main/App';
import { Button, Card, Spin } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { replaysParser, Replay1v1, Replay2v2, EugenUser } from './parsers/replaysParser';
import { getStats1v1, getStats2v2, Statistics1v1, Statistics2v2 } from './stats';
import { ReplaysTable } from './components/ReplaysTable';
import { Stats } from './components/Statistics';
import { DirectoriesSelect } from './components/DirectoriesSelect';
import { Players } from './components/Players';
import { SettingOutlined } from '@ant-design/icons';
import { SettingsDrawer } from './drawers/SettingsDrawer';
import { DailyRecap } from './components/DailyRecap';
import { Version } from './components/Version';

dayjs.extend(relativeTime);

function App() {
  const [directories, setDirectories] = useState<string[]>([]);
  const [replays1v1, setReplays1v1] = useState<Replay1v1[]>([]);
  const [replays2v2, setReplays2v2] = useState<Replay2v2[]>([]);
  const [stats1v1, setStats1v1] = useState<Statistics1v1>();
  const [stats2v2, setStats2v2] = useState<Statistics2v2>();
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [eugenUsers, setEugenUsers] = useState<EugenUser[]>();

  const run = async () => {
    setLoading(true);
    setReplays1v1([]);
    setReplays2v2([]);
    setStats1v1(undefined);
    setStats2v2(undefined);

    try {
      const data = await GetReplays(directories);
      const { replays1v1, replays2v2, eugenUsers } = await replaysParser(data);
      const sorted1v1Replays = replays1v1.sort(
        (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()
      );
      const sorted2v2Replays = replays2v2.sort(
        (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()
      );

      setEugenUsers(eugenUsers);

      setReplays1v1(sorted1v1Replays);
      setReplays2v2(replays2v2);
      setStats1v1(getStats1v1(replays1v1));
      setStats2v2(getStats2v2(replays2v2));
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
            <Version />
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
              {loading ? 'Loading' : replays1v1.length === 0 ? 'Generate' : 'Refresh'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {replays1v1.length > 0 && eugenUsers ? <DailyRecap eugenUsers={eugenUsers} /> : null}
            <Card
              tabList={[
                {
                  key: '1',
                  label: 'Summary',
                  children: (
                    <div className="pt-4 mb-10">
                      <ReplaysTable replays={replays1v1} />
                    </div>
                  )
                },
                {
                  key: '2',
                  label: 'Players',
                  children: (
                    <div className="pt-4 mb-10">{stats ? <Players replays={replays1v1} /> : null}</div>
                  )
                },
                {
                  key: '3',
                  label: 'Statistics',
                  children: (
                    <div className="pt-4 mb-10">{stats ? <Stats stats={stats1v1} /> : null}</div>
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
