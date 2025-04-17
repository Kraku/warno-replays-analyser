import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PlayerHistory } from '../../parsers/playersParser';
import { Table } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';

dayjs.extend(relativeTime);

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
        {`${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`}
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
    title: 'Result',
    dataIndex: 'result',
    key: 'result'
  }
];

export const OurGamesTable = ({ history }: { history: PlayerHistory[] }) => {
  return (
    <Table
      className="mb-4"
      dataSource={history}
      columns={columns}
      size="small"
      rowKey="createdAt"
      pagination={{
        pageSize: 10
      }}
    />
  );
};
