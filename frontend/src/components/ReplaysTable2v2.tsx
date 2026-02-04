import { Button, Table } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Replay2v2 } from '../parsers/replaysParser';
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

const getColumns = (onOpenPlayer?: (playerId: string) => void): ColumnType<Replay2v2>[] => [
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
        <CopyToClipboard text={record.filePath}>
          <CopyOutlined />
        </CopyToClipboard>
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
    title: 'Teammate Name',
    key: 'teammateName',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      a.allyData.playerName.localeCompare(b.allyData.playerName),
    render: (_, record) => (
      <button
        type="button"
        className={[
          'block w-full text-left truncate',
          onOpenPlayer && record.allyData.playerId ? 'cursor-pointer hover:underline' : 'cursor-default'
        ].join(' ')}
        title={onOpenPlayer ? 'Open player details' : undefined}
        onClick={() => {
          if (!onOpenPlayer) return;
          if (!record.allyData.playerId) return;
          onOpenPlayer(record.allyData.playerId.toString());
        }}>
        {record.allyData.playerName}
      </button>
    )
  },
  {
    title: 'Teammate Division',
    key: 'teammateDivision',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      (a.allyData.playerDivision || '').localeCompare(b.allyData.playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.allyData.playerDivision}{' '}
        {record.allyData.playerDeck ? (
          <>
            <CopyToClipboard text={record.allyData.playerDeck}>
              <CopyOutlined />
            </CopyToClipboard>{' '}
            <a
              href={waryesDeckBuilderUrl(record.allyData.playerDeck)}
              target="_blank"
              rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        ) : null}
      </div>
    )
  },
  {
    title: 'Enemy 1 Name',
    key: 'enemy1Name',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      a.enemiesData[0].playerName.localeCompare(b.enemiesData[0].playerName),
    render: (_, record) => (
      <button
        type="button"
        className={[
          'block w-full text-left truncate',
          onOpenPlayer && record.enemiesData[0]?.playerId
            ? 'cursor-pointer hover:underline'
            : 'cursor-default'
        ].join(' ')}
        title={onOpenPlayer ? 'Open player details' : undefined}
        onClick={() => {
          if (!onOpenPlayer) return;
          const playerId = record.enemiesData[0]?.playerId;
          if (!playerId) return;
          onOpenPlayer(playerId.toString());
        }}>
        {record.enemiesData[0].playerName}
      </button>
    )
  },
  {
    title: 'Enemy 1 Division',
    key: 'enemy1Division',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      (a.enemiesData[0].playerDivision || '').localeCompare(b.enemiesData[0].playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.enemiesData[0].playerDivision}{' '}
        {record.enemiesData[0].playerDeck ? (
          <>
            <CopyToClipboard text={record.enemiesData[0].playerDeck}>
              <CopyOutlined />
            </CopyToClipboard>{' '}
            <a
              href={waryesDeckBuilderUrl(record.enemiesData[0].playerDeck)}
              target="_blank"
              rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        ) : null}
      </div>
    )
  },
  {
    title: 'Enemy 2 Name',
    key: 'enemy2Name',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      a.enemiesData[1].playerName.localeCompare(b.enemiesData[1].playerName),
    render: (_, record) => (
      <button
        type="button"
        className={[
          'block w-full text-left truncate',
          onOpenPlayer && record.enemiesData[1]?.playerId
            ? 'cursor-pointer hover:underline'
            : 'cursor-default'
        ].join(' ')}
        title={onOpenPlayer ? 'Open player details' : undefined}
        onClick={() => {
          if (!onOpenPlayer) return;
          const playerId = record.enemiesData[1]?.playerId;
          if (!playerId) return;
          onOpenPlayer(playerId.toString());
        }}>
        {record.enemiesData[1].playerName}
      </button>
    )
  },
  {
    title: 'Enemy 2 Division',
    key: 'enemy2Division',
    sorter: (a: Replay2v2, b: Replay2v2) =>
      (a.enemiesData[1].playerDivision || '').localeCompare(b.enemiesData[1].playerDivision || ''),
    render: (_, record) => (
      <div>
        {record.enemiesData[1].playerDivision}{' '}
        {record.enemiesData[1].playerDeck ? (
          <>
            <CopyToClipboard text={record.enemiesData[1].playerDeck}>
              <CopyOutlined />
            </CopyToClipboard>{' '}
            <a
              href={waryesDeckBuilderUrl(record.enemiesData[1].playerDeck)}
              target="_blank"
              rel="noreferrer">
              <LinkOutlined />
            </a>
          </>
        ) : null}
      </div>
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
    ellipsis: true,
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
    onFilter: (value: boolean | React.Key, record: Replay2v2) =>
      record.result.includes(String(value)),
    sorter: (a: Replay2v2, b: Replay2v2) => a.result.localeCompare(b.result)
  }
];

export const ReplaysTable2v2 = ({
  replays,
  onOpenPlayer
}: {
  replays: Replay2v2[];
  onOpenPlayer?: (playerId: string) => void;
}) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) => {
    const searchNames = replay.enemiesData.map((enemy) => enemy.playerName);
    searchNames.push(replay.allyData.playerName);
    return transliterate(searchNames.join().toLowerCase()).includes(
      transliterate(searchText.toLowerCase())
    );
  });

  const exportCsv = () => {
    const rows = filteredReplays.map((r) => ({
      createdAt: r.createdAt,
      map: r.map,
      result: r.result,
      myDivision: r.division,
      allyName: r.allyData.playerName,
      allyId: r.allyData.playerId,
      allyDivision: r.allyData.playerDivision,
      enemy1Name: r.enemiesData[0]?.playerName,
      enemy1Id: r.enemiesData[0]?.playerId,
      enemy1Division: r.enemiesData[0]?.playerDivision,
      enemy2Name: r.enemiesData[1]?.playerName,
      enemy2Id: r.enemiesData[1]?.playerId,
      enemy2Division: r.enemiesData[1]?.playerDivision,
      durationSeconds: r.duration,
      matchId: r.id,
      replayPath: r.filePath
    }));

    const columns = [
      'createdAt',
      'map',
      'result',
      'myDivision',
      'allyName',
      'allyId',
      'allyDivision',
      'enemy1Name',
      'enemy1Id',
      'enemy1Division',
      'enemy2Name',
      'enemy2Id',
      'enemy2Division',
      'durationSeconds',
      'matchId',
      'replayPath'
    ];

    downloadCsv(`replays-2v2-${dayjs().format('YYYY-MM-DD')}.csv`, toCsv(rows, columns));
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        <Search
          placeholder="Find ally or enemy by name"
          onSearch={handleSearch}
          className="flex-1"
          allowClear
        />
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
