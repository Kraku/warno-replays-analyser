import { useEffect, useState } from 'react';
import './App.css';
import { Select, Button, Card, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Events } from '@wailsio/runtime';

import { Version } from './components/Version';
import { DirectoriesSelect } from './components/DirectoriesSelect';
import { ReplaysTable1v1 } from './components/ReplaysTable1v1';
import { ReplaysTable2v2 } from './components/ReplaysTable2v2';
import { Stats1v1 } from './components/Statistics/Statistics';
import { Stats2v2 } from './components/Statistics2v2';
import { Players } from './components/Players';
import { Teams } from './components/Teams';
import { SettingsDrawer } from './drawers/SettingsDrawer';
import { DailyRecap } from './components/DailyRecap';
import { useReplayContext } from './contexts/ReplayContext';
import { Leaderboard } from './components/Leaderboard';

function App() {
  const {
    directories,
    setDirectories,
    replays1v1,
    replays2v2,
    stats1v1,
    stats2v2,
    playerNamesMap,
    loading,
    gameMode,
    setGameMode,
    refresh
  } = useReplayContext();

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    Events.On('replay-file-added', () => {
      refresh();
    });
  }, []);

  return (
    <>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">WARNO Replays Analyser</div>
            <Version />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={gameMode}
              onChange={setGameMode}
              className="w-14"
              options={[
                { value: '1v1', label: '1v1' },
                { value: '2v2', label: '2v2' }
              ]}
            />
            <Button icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>
              Settings
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DirectoriesSelect directories={directories} setDirectories={setDirectories} />
          <Button
            type="primary"
            onClick={() => refresh()}
            disabled={loading || directories.length === 0}
            loading={loading}>
            {loading ? 'Loading' : replays1v1.length === 0 ? 'Generate' : 'Refresh'}
          </Button>
        </div>

        <div className="relative mt-4">
          {loading ? (
            <div className="fixed inset-0 flex justify-center items-center z-50 bg-neutral-800 bg-opacity-80">
              <Spin size="large" />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 mt-4">
            {gameMode === '1v1' && (
              <>
                <DailyRecap replays={replays1v1} />
                <Card
                  tabList={[
                    {
                      key: '1',
                      label: 'Summary',
                      children: (
                        <div className="pt-4 mb-10">
                          <ReplaysTable1v1 replays={replays1v1} />
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: 'Players',
                      children: (
                        <div className="pt-4 mb-10">
                          {stats1v1 && (
                            <Players replays={replays1v1} playerNamesMap={playerNamesMap} />
                          )}
                        </div>
                      )
                    },
                    {
                      key: '3',
                      label: 'Statistics',
                      children: (
                        <div className="pt-4 mb-10">
                          {stats1v1 && <Stats1v1 stats={stats1v1} />}
                        </div>
                      )
                    },
                    {
                      key: '4',
                      label: 'Leaderboard',
                      children: (
                        <div className="pt-4 mb-10">
                          <Leaderboard />
                        </div>
                      )
                    }
                  ]}
                  styles={{ body: { padding: 0 } }}
                />
                <div className="text-xs flex justify-end">Brought to you by Grand Potato</div>
              </>
            )}

            {gameMode === '2v2' && (
              <>
                <Card
                  tabList={[
                    {
                      key: '1',
                      label: 'Summary',
                      children: (
                        <div className="pt-4 mb-10">
                          <ReplaysTable2v2 replays={replays2v2} />
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: 'Teams',
                      children: (
                        <div className="pt-4 mb-10">
                          <Teams replays={replays2v2} playerNamesMap={playerNamesMap} />
                        </div>
                      )
                    },
                    {
                      key: '3',
                      label: 'Statistics',
                      children: (
                        <div className="pt-4 mb-10">
                          {stats2v2 && <Stats2v2 stats={stats2v2} />}
                        </div>
                      )
                    }
                  ]}
                  styles={{ body: { padding: 0 } }}
                />
                <div className="text-xs flex justify-end">Brought to you by Suojeluskunta</div>
              </>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsDrawer
          onClose={() => setShowSettings(false)}
          onSave={() => {
            refresh();
            setShowSettings(false);
          }}
        />
      )}
    </>
  );
}

export default App;
