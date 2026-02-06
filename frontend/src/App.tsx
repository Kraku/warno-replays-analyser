import { useEffect, useState } from 'react';
import './App.css';
import { Button, Card, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { EventsOff, EventsOn } from '../wailsjs/runtime/runtime';

import { Version } from './components/Version';
import { DirectoriesSelect } from './components/DirectoriesSelect';
import { ReplaysTable } from './components/ReplaysTable';
import { PlayerStats } from './components/Statistics/Statistics';
import { Players } from './components/Players';
import { SettingsDrawer } from './drawers/SettingsDrawer';
import { DailyRecap } from './components/DailyRecap';
import { useReplayContext } from './contexts/ReplayContext';
import { Leaderboard } from './components/Leaderboard';
import { GlobalStats } from './components/GlobalStats';

function App() {
  const { directories, setDirectories, replays, stats, playerNamesMap, loading, refresh } =
    useReplayContext();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined);

  const openPlayerDetails = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('2');
  };

  useEffect(() => {
    const handler = () => refresh();
    EventsOn('replay-file-added', handler);

    return () => {
      EventsOff('replay-file-added');
    };
  }, []);

  return (
    <>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">WARNO Ranked Replays Analyser</div>
            <Version />
          </div>

          <div className="flex items-center gap-2">
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
            {loading ? 'Loading' : replays.length === 0 ? 'Generate' : 'Refresh'}
          </Button>
        </div>

        <div className="relative mt-4">
          {loading ? (
            <div className="fixed inset-0 flex justify-center items-center z-50 bg-neutral-800 bg-opacity-80">
              <Spin size="large" />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 mt-4">
            {replays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="text-neutral-300">
                  By clicking <span className="font-bold">Generate</span> you agree to share your
                  replays data with us
                </div>
                <div className="max-w-xl text-neutral-400 text-sm">
                  Every replay helps the app get better and unlock new insights for you and the
                  community. The data we collect is focused on divisions and maps and will not
                  be shared with third parties or used to gain leverage over you in the game.
                </div>
              </div>
            ) : (
              <>
                <DailyRecap replays={replays} />
                <Card
                  tabList={[
                    {
                      key: '1',
                      label: 'Replays',
                      children: (
                        <div className="pt-4 mb-10">
                          <ReplaysTable replays={replays} onOpenPlayer={openPlayerDetails} />
                        </div>
                      )
                    },
                    {
                      key: '2',
                      label: 'Players',
                      children: (
                        <div className="pt-4 mb-10">
                          {stats && (
                            <Players
                              replays={replays}
                              playerNamesMap={playerNamesMap}
                              selectedPlayerId={selectedPlayerId}
                              onSelectedPlayerChange={setSelectedPlayerId}
                            />
                          )}
                        </div>
                      )
                    },
                    {
                      key: '3',
                      label: 'Your Statistics',
                      children: (
                        <div className="pt-4 mb-10">{stats && <PlayerStats stats={stats} />}</div>
                      )
                    },
                    {
                      key: '4',
                      label: 'Global Statistics',
                      children: <div className="pt-4 mb-10">{stats && <GlobalStats />}</div>
                    },
                    {
                      key: '5',
                      label: 'Leaderboard',
                      children: (
                        <div className="pt-4 mb-10">
                          <Leaderboard
                            onOpenPlayer={(playerId) => {
                              openPlayerDetails(playerId);
                            }}
                          />
                        </div>
                      )
                    }
                  ]}
                  activeTabKey={activeTab}
                  onTabChange={(key) => setActiveTab(key)}
                  styles={{ body: { padding: 0 } }}
                />
                <div className="text-xs flex justify-end">Brought to you by Grand Potato</div>
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
