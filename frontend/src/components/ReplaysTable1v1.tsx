import { Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay1v1 } from '../parsers/replaysParser';
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

const columns: ColumnType<Replay1v1>[] = [
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
        {`${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()}) `}
        <CopyToClipboard text={record.filePath}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    ),
    sorter: (a: Replay1v1, b: Replay1v1) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
  },
  {
    title: 'Enemy Name',
    dataIndex: 'enemyName',
    key: 'enemyName',
    sorter: (a: Replay1v1, b: Replay1v1) => a.enemyName.localeCompare(b.enemyName)
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division',
    sorter: (a: Replay1v1, b: Replay1v1) => (a.division || '').localeCompare(b.division || ''),
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
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
    sorter: (a: Replay1v1, b: Replay1v1) =>
      (a.enemyDivision || '').localeCompare(b.enemyDivision || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.enemyDeck}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'My Rank',
    dataIndex: 'rank',
    key: 'rank',
    sorter: (a: Replay1v1, b: Replay1v1) => a.rank.localeCompare(b.rank)
  },
  {
    title: 'Enemy Rank',
    dataIndex: 'enemyRank',
    key: 'enemyRank',
    sorter: (a: Replay1v1, b: Replay1v1) => parseInt(a.enemyRank) - parseInt(b.enemyRank)
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss'),
    sorter: (a: Replay1v1, b: Replay1v1) =>
      dayjs(a.duration, 'mm:ss').unix() - dayjs(b.duration, 'mm:ss').unix()
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map',
    sorter: (a: Replay1v1, b: Replay1v1) => a.map.localeCompare(b.map)
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
    onFilter: (value: boolean | React.Key, record: Replay1v1) =>
      record.result.includes(String(value)),
    sorter: (a: Replay1v1, b: Replay1v1) => a.result.localeCompare(b.result)
  },
  {
    title: 'Predicted Elo Change',
    dataIndex: 'eloChange',
    key: 'eloChange',
    sorter: (a: Replay1v1, b: Replay1v1) => parseInt(a.enemyElo) - parseInt(b.enemyElo)
  }
];

export const ReplaysTable1v1 = ({ replays }: { replays: Replay1v1[] }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) =>
    transliterate(replay.enemyName.toLowerCase()).includes(transliterate(searchText.toLowerCase()))
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
