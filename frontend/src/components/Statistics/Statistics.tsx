import { Col, Row, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Statistics1v1 } from '../../stats';
import { renderVictoryRatio } from '../../helpers/renderVictoryRatio';
import RankHistoryChart from './RankHistoryChart';
import { formatDuration } from '../../helpers/formatDuration';
import { SeasonSelect } from './StartDateSelect';

dayjs.extend(relativeTime);

const TableComponent = ({
  dataSource,
  columns,
  rowKey,
  title
}: {
  dataSource: any[];
  columns: any[];
  rowKey: string;
  title: string;
}) => (
  <>
    <Typography.Title level={4} className="mt-4">
      {title}
    </Typography.Title>
    <Table
      className="mt-4"
      dataSource={dataSource}
      columns={columns}
      size="small"
      rowKey={rowKey}
    />
  </>
);

const createColumn = (
  title: string,
  dataIndex: string,
  key: string,
  render?: (value: any) => string,
  sorter?: (a: any, b: any) => number,
  filters?: { text: string; value: string }[],
  onFilter?: (value: string, record: any) => boolean
): any => ({
  title,
  dataIndex,
  key,
  render,
  sorter,
  filters,
  onFilter
});

export const renderRankHistoryTooltip = ({ payload }: any) => {
  if (payload?.length === 0) return null;

  return (
    <div className="bg-gray-800 p-2">
      <Typography.Text>{dayjs(payload[0].payload.date).format('YYYY-MM-DD HH:mm')}</Typography.Text>
      <br />
      <div className="bold text-xl">{payload[0].payload.rank}</div>
    </div>
  );
};

export const Stats1v1 = ({ stats }: { stats: Statistics1v1 }) => {
  if (!stats) {
    return null;
  }

  const rankHistoryColumns = [
    createColumn('Division', 'division', 'division', undefined, (a, b) =>
      a.division.localeCompare(b.division)
    ),
    createColumn(
      'Victory Ratio',
      'victoryRatio',
      'victoryRatio',
      renderVictoryRatio,
      (a, b) => a.victoryRatio - b.victoryRatio
    ),
    createColumn(
      'Games',
      'games',
      'games',
      undefined,
      (a, b) => a.games - b.games,
      [
        { text: 'More than 10 games', value: 'moreThan10' },
        { text: '10 or less games', value: '10OrLess' }
      ],
      (value, record) => {
        if (value === 'moreThan10') return record.games > 10;
        if (value === '10OrLess') return record.games <= 10;
        return true;
      }
    )
  ];

  const winrateByEnemyRankColumns = [
    {
      title: 'Rank Bucket',
      dataIndex: 'bucket',
      key: 'bucket'
    },
    {
      title: 'Wins',
      dataIndex: 'wins',
      key: 'wins'
    },
    {
      title: 'Total Games',
      dataIndex: 'total',
      key: 'total'
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate'
    }
  ];

  const mapVictoryRatioColumns = [
    createColumn('Map', 'map', 'map', undefined, (a, b) => a.map.localeCompare(b.map)),
    createColumn(
      'Victory Ratio',
      'victoryRatio',
      'victoryRatio',
      renderVictoryRatio,
      (a, b) => a.victoryRatio - b.victoryRatio
    ),
    createColumn(
      'Games',
      'games',
      'games',
      undefined,
      (a, b) => a.games - b.games,
      [
        { text: 'More than 10 games', value: 'moreThan10' },
        { text: '10 or less games', value: '10OrLess' }
      ],
      (value, record) => {
        if (value === 'moreThan10') return record.games > 10;
        if (value === '10OrLess') return record.games <= 10;
        return true;
      }
    )
  ];

  const winrateByEnemyRankData = Object.entries(stats.winrateByEnemyRank)
    .map(([bucket, stats]) => ({
      key: bucket,
      bucket,
      wins: stats.wins,
      total: stats.total,
      winRate: ((stats.wins / stats.total) * 100).toFixed(1) + '%'
    }))
    .sort(
      (a, b) =>
        parseInt((a.bucket.match(/\d+/) || ['0'])[0], 10) -
        parseInt((b.bucket.match(/\d+/) || ['0'])[0], 10)
    );

  return (
    <div className="flex w-full gap-4">
      <div className="w-full pr-4 border-r border-neutral-800">
        <Typography.Title level={4} className="mt-4">
          Rank History
        </Typography.Title>

        <RankHistoryChart rankHistory={stats.rankHistory} />

        <TableComponent
          columns={winrateByEnemyRankColumns}
          dataSource={winrateByEnemyRankData}
          rowKey="bucket"
          title="Victory Ratio by Enemy Rank"
        />

        <TableComponent
          dataSource={stats.divisionVictoryRatios}
          columns={rankHistoryColumns}
          rowKey="division"
          title="Victory Ratio per Division"
        />

        <TableComponent
          dataSource={stats.enemyDivisionVictoryRatios}
          columns={rankHistoryColumns}
          rowKey="enemyDivision"
          title="Victory Ratio Against Enemy Divisions"
        />

        <TableComponent
          dataSource={stats.mapVictoryRatios}
          columns={mapVictoryRatioColumns}
          rowKey="map"
          title="Map Victory Ratio"
        />
      </div>

      <div className="w-44">
        <div className="flex mb-4 border-b border-neutral-800 pb-6">
          <SeasonSelect />
        </div>

        <div className="flex flex-col gap-4">
          <Statistic title="Games Total" value={stats.totalGames} />
          <Statistic title="Games Won" value={stats.wonGames} />
          <Statistic title="Time Spent" value={formatDuration(stats.timeSpent)} />
          <Statistic title="Victory Ratio" value={renderVictoryRatio(stats.victoryRatio)} />
          <Statistic
            title="Average Game Duration"
            value={`${(stats.averageGameDuration / 60).toFixed(2)} min`}
          />
          <Statistic title="Longest Winning Streak" value={stats.longestWinningStreak} />
          <Statistic title="Longest Losing Streak" value={stats.longestLosingStreak} />{' '}
        </div>
      </div>
    </div>
  );
};
