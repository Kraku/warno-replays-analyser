import { Button, Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay } from '../parsers/replaysParser';
import { ColumnType } from 'antd/es/table';
import { Input } from 'antd';
import { useState } from 'react';
import { CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import duration from 'dayjs/plugin/duration';
import CopyToClipboard from 'react-copy-to-clipboard';
import { transliterate } from '../helpers/transliterate';
import { downloadCsv, toCsv } from '../helpers/exportCsv';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Search } = Input;

const waryesDeckBuilderUrl = (deckCode: string) =>
  `https://waryes.com/deck-builder?code=${encodeURIComponent(deckCode)}`;

const getColumns = (onOpenPlayer?: (playerId: string) => void): ColumnType<Replay>[] => [
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
    sorter: (a: Replay, b: Replay) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
  },
  {
    title: 'Enemy Name',
    dataIndex: 'enemyName',
    key: 'enemyName',
    sorter: (a: Replay, b: Replay) => a.enemyName.localeCompare(b.enemyName),
    render: (value: string, record) => (
      <button
        type="button"
        className={[
          'block w-full text-left truncate',
          onOpenPlayer && record.enemyId ? 'cursor-pointer hover:underline' : 'cursor-default'
        ].join(' ')}
        title={onOpenPlayer ? 'Open player details' : undefined}
        onClick={() => {
          if (!onOpenPlayer) return;
          if (!record.enemyId) return;
          onOpenPlayer(record.enemyId.toString());
        }}>
        {value}
      </button>
    )
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division',
    sorter: (a: Replay, b: Replay) => (a.division || '').localeCompare(b.division || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        {record.deck ? (
          <>
            <CopyToClipboard text={record.deck}>
              <CopyOutlined />
            </CopyToClipboard>{' '}
            <a href={waryesDeckBuilderUrl(record.deck)} target="_blank" rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        ) : null}
      </div>
    )
  },
  {
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
    sorter: (a: Replay, b: Replay) => (a.enemyDivision || '').localeCompare(b.enemyDivision || ''),
    render: (value: string, record) => (
      <div>
        {value}{' '}
        {record.enemyDeck ? (
          <>
            <CopyToClipboard text={record.enemyDeck}>
              <CopyOutlined />
            </CopyToClipboard>{' '}
            <a href={waryesDeckBuilderUrl(record.enemyDeck)} target="_blank" rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        ) : null}
      </div>
    )
  },
  {
    title: 'My Rank',
    dataIndex: 'rank',
    key: 'rank',
    sorter: (a: Replay, b: Replay) => a.rank.localeCompare(b.rank)
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
    title: 'Estimated Elo',
    dataIndex: 'eloChange',
    key: 'eloChange',
    sorter: (a: Replay, b: Replay) => a.eloChange - b.eloChange
  }
];

export const ReplaysTable = ({
  replays,
  onOpenPlayer
}: {
  replays: Replay[];
  onOpenPlayer?: (playerId: string) => void;
}) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) =>
    transliterate(replay.enemyName.toLowerCase()).includes(transliterate(searchText.toLowerCase()))
  );

  const exportCsv = () => {
    const rows = filteredReplays.map((r) => ({
      createdAt: r.createdAt,
      enemyName: r.enemyName,
      enemyId: r.enemyId,
      map: r.map,
      result: r.result,
      myDivision: r.division,
      enemyDivision: r.enemyDivision,
      myRank: r.rank,
      enemyRank: r.enemyRank,
      durationSeconds: r.duration,
      predictedEloChange: r.eloChange,
      matchId: r.id,
      replayPath: r.filePath
    }));

    const columns = [
      'createdAt',
      'enemyName',
      'enemyId',
      'map',
      'result',
      'myDivision',
      'enemyDivision',
      'myRank',
      'enemyRank',
      'durationSeconds',
      'predictedEloChange',
      'matchId',
      'replayPath'
    ];

    downloadCsv(`replays-ranked-${dayjs().format('YYYY-MM-DD')}.csv`, toCsv(rows, columns));
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        <Search placeholder="Find enemy" onSearch={handleSearch} className="flex-1" allowClear />
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <Table
        dataSource={filteredReplays}
        columns={getColumns(onOpenPlayer)}
        size="small"
        pagination={false}
        rowKey="fileName"
      />
    </>
  );
};
