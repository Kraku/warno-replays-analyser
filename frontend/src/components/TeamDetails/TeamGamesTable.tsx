import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Table } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { TeamHistory } from '../../parsers/teamsParser';

dayjs.extend(relativeTime);

const columns: ColumnType<TeamHistory>[] = [
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
    key: 'division',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.division}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Teammate Name',
    dataIndex: 'allyName',
    key: 'allyName',
  },
  {
    title: 'Teammate Division',
    dataIndex: 'allyDivision',
    key: 'allyDivision',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.allyDivision}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Enemy 1 Name',
    dataIndex: 'enemy1Name',
    key: 'enemy1Name',
  },
  {
    title: 'Enemy 1 Division',
    dataIndex: 'enemy1Division',
    key: 'enemy1Division',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.enemy1Deck}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Enemy 2 Name',
    dataIndex: 'enemy2Name',
    key: 'enemy2Name',
  },
  {
    title: 'Enemy 2 Division',
    dataIndex: 'enemy2Division',
    key: 'enemy2Division',
    render: (value: string, record) => (
      <div>
        {value}{' '}
        <CopyToClipboard text={record.enemy2Deck}>
          <CopyOutlined />
        </CopyToClipboard>
      </div>
    )
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration',
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss'),
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map',
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result',
    filters: [
      { text: 'Victory', value: 'Victory' },
      { text: 'Defeat', value: 'Defeat' },
      { text: 'Draw', value: 'Draw' }
    ]
  }
];

export const TeamGamesTable = ({ history }: { history: TeamHistory[] }) => {
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
