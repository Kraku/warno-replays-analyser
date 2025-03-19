import { useState } from 'react';
import './App.css';
import { Analyse } from '../wailsjs/go/main/App';
import { Button, Card, Divider, Spin } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { parser, Replay } from './parser';
import { getStats, Statistics } from './stats';
import { ReplaysTable } from './components/ReplaysTable';
import { Stats } from './components/Statistics';
import { DirectoriesSelect } from './components/DirectoriesSelect';

dayjs.extend(relativeTime);

function App() {
  const [directories, setDirectories] = useState<string[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [stats, setStats] = useState<Statistics>();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);

    setReplays([]);
    setStats(undefined);

    try {
      const data = await Analyse(directories);
      const replays = await parser(JSON.parse(data));

      setReplays(replays);
      setStats(getStats(replays));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">WARNO Replays Analyser</h1>

      <div>
        <div className="flex items-center gap-2">
          <DirectoriesSelect directories={directories} setDirectories={setDirectories} />
          <Button type="primary" onClick={run} disabled={loading}>
            Generate
          </Button>
        </div>
      </div>

      <Divider />

      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
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
              label: 'Statistics',
              children: <div className="pt-4 mb-10">{stats ? <Stats stats={stats} /> : null}</div>
            }
          ]}
          styles={{
            body: { padding: 0 }
          }}
        />
      )}
    </div>
  );
}

export default App;
