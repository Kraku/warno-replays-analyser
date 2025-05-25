import { Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay2v2 } from '../parsers/replaysParser';
import { ColumnType } from 'antd/es/table';
import { Input } from 'antd';
import { useState } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import duration from 'dayjs/plugin/duration';
import CopyToClipboard from 'react-copy-to-clipboard';
import { transliterate } from '../helpers/transliterate';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Search } = Input;

const columns: ColumnType<Replay2v2>[] = [
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string, record) => (
      <div
        className={[
          'border-l-2 pl-2',
          record.result === 'Victory'
            ? 'border-emerald-950'
            : record.result === 'Defeat'
              ? 'border-rose-950'
              : 'border-gray-500'
        ].join(' ')}>
        {`${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`}
      </div>
    ),
    sorter: (a: Replay2v2, b: Replay2v2) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division',
    sorter: (a: Replay2v2, b: Replay2v2) => (a.division || '').localeCompare(b.division || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.deck}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'My Rank',
    dataIndex: 'rank',
    key: 'rank',
    sorter: (a: Replay2v2, b: Replay2v2) => a.rank.localeCompare(b.rank)
  },
  {
    title: 'Teammate Name',
    key: 'teammateName',
    sorter: (a: Replay2v2, b: Replay2v2) => a.allyData.playerName.localeCompare(b.allyData.playerName),
    render: (_, record) => (
      <div>{record.allyData.playerName}</div>
    )
  },
  {
    title: 'Teammate Division',
    key: 'teammateDivision',
    sorter: (a: Replay2v2, b: Replay2v2) => (a.allyData.playerDivision || '').localeCompare(b.allyData.playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.allyData.playerDivision}{' '}
        <CopyToClipboard text={record.allyData.playerDeck}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Teammate Rank',
    key: 'teammateRank',
    sorter: (a: Replay2v2, b: Replay2v2) => parseInt(a.allyData.playerRank) - parseInt(b.allyData.playerRank),
    render: (_, record) => (
      <div>{record.allyData.playerRank}</div>
    )
  },
  {
    title: 'Enemy 1 Name',
    key: 'enemy1Name',
    sorter: (a: Replay2v2, b: Replay2v2) => a.enemiesData[0].playerName.localeCompare(b.enemiesData[0].playerName),
    render: (_, record) => (
      <div>{record.enemiesData[0].playerName}</div>
    )
  },
  {
    title: 'Enemy 1 Division',
    key: 'enemy1Division',
    sorter: (a: Replay2v2, b: Replay2v2) => (a.enemiesData[0].playerDivision || '').localeCompare(b.enemiesData[0].playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.enemiesData[0].playerDivision}{' '}
        <CopyToClipboard text={record.enemiesData[0].playerDivision}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Enemy 1 Rank',
    key: 'enemy1Rank',
    sorter: (a: Replay2v2, b: Replay2v2) => parseInt(a.enemiesData[0].playerRank) - parseInt(b.enemiesData[0].playerRank),
    render: (_, record) => (
      <div>{record.enemiesData[0].playerRank}</div>
    )
  },
  {
    title: 'Enemy 2 Name',
    key: 'enemy2Name',
    sorter: (a: Replay2v2, b: Replay2v2) => a.enemiesData[1].playerName.localeCompare(b.enemiesData[1].playerName),
    render: (_, record) => (
      <div>{record.enemiesData[1].playerName}</div>
    )
  },
  {
    title: 'Enemy 2 Division',
    key: 'enemy2Division',
    sorter: (a: Replay2v2, b: Replay2v2) => (a.enemiesData[1].playerDivision || '').localeCompare(b.enemiesData[1].playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.enemiesData[1].playerDivision}{' '}
        <CopyToClipboard text={record.enemiesData[1].playerDivision}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Enemy 2 Rank',
    key: 'enemy2Rank',
    sorter: (a: Replay2v2, b: Replay2v2) => parseInt(a.enemiesData[1].playerRank) - parseInt(b.enemiesData[1].playerRank),
    render: (_, record) => (
      <div>{record.enemiesData[1].playerRank}</div>
    )
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss'),
    sorter: (a: Replay2v2, b: Replay2v2) =>
      dayjs(a.duration, 'mm:ss').unix() - dayjs(b.duration, 'mm:ss').unix()
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map',
    sorter: (a: Replay2v2, b: Replay2v2) => a.map.localeCompare(b.map)
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
    onFilter: (value: boolean | React.Key, record: Replay2v2) => record.result.includes(String(value)),
    sorter: (a: Replay2v2, b: Replay2v2) => a.result.localeCompare(b.result)
  }
];

export const ReplaysTable2v2 = ({ replays }: { replays: Replay2v2[] }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) => {
    const searchNames = replay.enemiesData.map(enemy => enemy.playerName);
    searchNames.push(replay.allyData.playerName);
    return transliterate(searchNames.join().toLowerCase()).includes(transliterate(searchText.toLowerCase()));
  });

  return (
    <>
      <Search placeholder="Find ally or enemy by name" onSearch={handleSearch} className="mb-2" allowClear />
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