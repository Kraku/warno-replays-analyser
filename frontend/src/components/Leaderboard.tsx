import { useEffect, useState, useMemo } from 'react';
import { GetLeaderboard } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { Table, Input } from 'antd';
import { useDebounce } from '../hooks/useDebounce';

const { Search } = Input;

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<(main.LeaderboardEntry & { rank: number })[]>([]);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    (async () => {
      const data = await GetLeaderboard();

      setLeaderboard(data.map((entry, i) => ({ ...entry, rank: i + 1 })));
    })();
  }, []);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return leaderboard;

    const lower = debouncedSearch.toLowerCase();

    return leaderboard.filter((entry) => entry.name.toLowerCase().includes(lower));
  }, [leaderboard, debouncedSearch]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'ig');

    return text.split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-900">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const columns = useMemo(
    () => [
      {
        title: '#',
        dataIndex: 'rank',
        key: 'rank',
        width: 50,
        align: 'center' as const
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (name: string) => highlightText(name, search)
      },
      {
        title: 'Elo',
        dataIndex: 'elo',
        key: 'elo',
        render: (elo: number) => elo.toFixed(0)
      }
    ],
    [search]
  );

  return (
    <div className="flex flex-col gap-2">
      <Search
        placeholder="Find player"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Table
        dataSource={filteredData}
        rowKey="eugenId"
        pagination={false}
        size="small"
        columns={columns}
      />
    </div>
  );
};
