import { useState } from "react";
import "./App.css";
import { Analyse } from "../wailsjs/go/main/App";
import { Button, Card, Divider, Input, Spin } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { parser, Replay } from "./parser";
import { getStats, Statistics } from "./stats";
import { ReplaysTable } from "./components/ReplaysTable";
import { Stats } from "./components/Statistics";

dayjs.extend(relativeTime);

function App() {
  const [directory, setDirectory] = useState(
    "D:\\steam\\userdata\\1861570968\\1611600\\remote" // TODO: try to auto detect
  );
  const [replays, setReplays] = useState<Replay[]>([]);
  const [stats, setStats] = useState<Statistics>();
  const [loading, setLoading] = useState(false);

  const updateName = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setDirectory(e.target.value);

  const run = async () => {
    setLoading(true);

    try {
      const data = await Analyse(directory);
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
          <Input
            onChange={updateName}
            autoComplete="off"
            value={directory}
            placeholder="Replays directory path"
            name="input"
            type="text"
          />
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
              key: "1",
              label: "Summary",
              children: (
                <div className="pt-4">
                  <ReplaysTable replays={replays} />
                </div>
              ),
            },
            {
              key: "2",
              label: "Statistics",
              children: (
                <div className="pt-4">
                  {stats ? <Stats stats={stats} /> : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

export default App;
