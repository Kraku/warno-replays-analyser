import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Spin, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import { main } from '../../../wailsjs/go/models';
import { getMinMax } from '../../helpers/getMinMax';

dayjs.extend(relativeTime);

const columns: ColumnType<main.PlayerGame>[] = [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (value: string, record) => (
      <div
        className={[
          'border-l-2 pl-2',
          record.result === 'victory' ? 'border-emerald-950' : 'border-rose-950'
        ].join(' ')}>
        {`${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`}
      </div>
    )
  },
  {
    title: 'Enemy Name',
    dataIndex: 'enemyName',
    key: 'enemyName'
  },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score'
  },
  {
    title: 'Stronger Opponent',
    key: 'stronger',
    render: (_v: string, record) => {
      const playerElo = (record.playerElo || []).map((elo) => Number(elo));
      const enemyElo = (record.enemyElo || []).map((elo) => Number(elo));
      const { min: playerMin } = getMinMax(playerElo);
      const { min: enemyMin } = getMinMax(enemyElo);

      return playerMin && enemyMin ? (playerMin > enemyMin ? 'No' : 'Yes') : '-';
    }
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result',
    render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
  }
];

export const GamesTable = ({
  history,
  isLoading
}: {
  history: main.PlayerGame[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Spin className="flex justify-center items-center h-full" />;
  }

  return (
    <Table
      className="mb-4"
      dataSource={history}
      columns={columns}
      size="small"
      rowKey="date"
      pagination={false}
    />
  );
};
