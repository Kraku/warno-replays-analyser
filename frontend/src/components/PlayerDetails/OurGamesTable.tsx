import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { PlayerHistory } from '../../parsers/playersParser';
import { Button, Table } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { downloadCsv, toCsv } from '../../helpers/exportCsv';

dayjs.extend(relativeTime);
dayjs.extend(duration);

const columns: ColumnType<PlayerHistory>[] = [
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
    )
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division'
  },
  {
    title: 'Enemy Division',
    dataIndex: 'enemyDivision',
    key: 'enemyDivision',
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
    key: 'rank'
  },
  {
    title: 'Enemy Rank',
    dataIndex: 'enemyRank',
    key: 'enemyRank'
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss')
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map'
  },
  {
    title: 'Difficulty',
    key: 'stronger',
    render: (_v: string, record) => {
      const playerRank = parseInt(record.rank);
      const enemyRank = parseInt(record.enemyRank);

      const diff = enemyRank - playerRank;

      if (diff > 250) return 'Very Easy';
      if (diff >= 150) return 'Easy';
      if (diff >= 50) return 'Moderate';
      if (diff > 0) return 'Challenging';
      if (diff > -50) return 'Hard';
      if (diff > -150) return 'Very Hard';
      if (diff >= -250) return 'Extreme Hard';
      if (diff < -250) return 'Impossible';
    }
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result'
  }
];

export const OurGamesTable = ({ history }: { history: PlayerHistory[] }) => {
  const exportCsv = () => {
    const rows = history
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((h) => ({
        createdAt: h.createdAt,
        map: h.map,
        result: h.result,
        myDivision: h.division,
        enemyDivision: h.enemyDivision,
        myRank: h.rank,
        enemyRank: h.enemyRank,
        durationSeconds: h.duration,
        matchId: h.id,
        replayPath: h.filePath
      }));

    const columns = [
      'createdAt',
      'map',
      'result',
      'myDivision',
      'enemyDivision',
      'myRank',
      'enemyRank',
      'durationSeconds',
      'matchId',
      'replayPath'
    ];

    downloadCsv('our-games-history.csv', toCsv(rows, columns));
  };

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button icon={<DownloadOutlined />} onClick={exportCsv} size="small">
          Export CSV
        </Button>
      </div>

      <Table
        dataSource={history}
        columns={columns}
        size="small"
        rowKey="createdAt"
        pagination={{
          pageSize: 10
        }}
      />
    </>
  );
};
