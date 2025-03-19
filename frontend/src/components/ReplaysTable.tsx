import { Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay } from '../parser';
import { ColumnType } from 'antd/es/table';
import { Input } from 'antd';
import { useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Search } = Input;

const columns: ColumnType<Replay>[] = [
  {
    title: 'Time',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) =>
      `${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`,
    sorter: (a: Replay, b: Replay) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result',
    filters: [
      { text: 'Victory', value: 'Victory' },
      { text: 'Defeat', value: 'Defeat' },
      { text: 'Draw', value: 'Draw' }
    ],
    onFilter: (value: boolean | React.Key, record: Replay) => record.result.includes(String(value)),
    sorter: (a: Replay, b: Replay) => a.result.localeCompare(b.result)
  },
  {
    title: 'Division',
    dataIndex: 'division',
    key: 'division',
    sorter: (a: Replay, b: Replay) => (a.division || '').localeCompare(b.division || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <a
          href={`https://war-yes.com/deck-builder?code=${record.deck}`}
          target="_blank"
          rel="noreferrer">
          <LinkOutlined />
        </a>
      </div>
    )
  },
  {
    title: 'Rank',
    dataIndex: 'rank',
    key: 'rank',
    sorter: (a: Replay, b: Replay) => a.rank.localeCompare(b.rank)
  },
  {
    title: 'Enemy Name',
    dataIndex: 'enemyName',
    key: 'enemyName',
    sorter: (a: Replay, b: Replay) => a.enemyName.localeCompare(b.enemyName)
  },
  {
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
    sorter: (a: Replay, b: Replay) => (a.enemyDivision || '').localeCompare(b.enemyDivision || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <a
          href={`https://war-yes.com/deck-builder?code=${record.enemyDeck}`}
          target="_blank"
          rel="noreferrer">
          <LinkOutlined />
        </a>
      </div>
    )
  },
  {
    title: 'Enemy Rank',
    dataIndex: 'enemyRank',
    key: 'enemyRank',
    sorter: (a: Replay, b: Replay) => parseInt(a.enemyRank) - parseInt(b.enemyRank)
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss'),
    sorter: (a: Replay, b: Replay) =>
      dayjs(a.duration, 'mm:ss').unix() - dayjs(b.duration, 'mm:ss').unix()
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map',
    sorter: (a: Replay, b: Replay) => a.map.localeCompare(b.map)
  }
];

export const ReplaysTable = ({ replays }: { replays: Replay[] }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) =>
    Object.values(replay).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <>
      <Search placeholder="Find enemy" onSearch={handleSearch} className="mb-2" allowClear />
      <Table
        dataSource={filteredReplays}
        columns={columns}
        size="small"
        pagination={false}
        rowKey="fileName"
      />
    </>
  );
};
