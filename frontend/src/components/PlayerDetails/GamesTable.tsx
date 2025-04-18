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
    title: 'Difficulty',
    key: 'stronger',
    render: (_v: string, record) => {
      const playerElo = (record.playerElo || []).map((elo) => Number(elo));
      const enemyElo = (record.enemyElo || []).map((elo) => Number(elo));
      const { min: playerMin } = getMinMax(playerElo);
      const { min: enemyMin } = getMinMax(enemyElo);

      if (!playerMin || !enemyMin) return 'Unknown';

      const diff = enemyMin - playerMin;

      if (diff <= -300) return 'Very Easy';
      if (diff <= -200) return 'Easy';
      if (diff <= -100) return 'Moderate';
      if (diff < 0) return 'Challenging';
      if (diff < 100) return 'Hard';
      if (diff < 200) return 'Very Hard';
      if (diff <= 300) return 'Extreme Hard';
      if (diff > 300) return 'Impossible';
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
