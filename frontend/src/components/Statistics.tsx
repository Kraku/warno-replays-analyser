import { Col, Row, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Statistics } from '../stats';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

dayjs.extend(relativeTime);

const renderVictoryRatio = (value: number) => `${value.toFixed(2)}%`;

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

export const Stats = ({ stats }: { stats: Statistics }) => {
  if (!stats) {
    return null;
  }

  const renderRankHistoryTooltip = ({ payload }: any) => {
    if (payload?.length === 0) return null;
    return (
      <div className="bg-gray-800 p-2">
        <Typography.Text>
          {dayjs(payload[0].payload.date).format('YYYY-MM-DD HH:mm')}
        </Typography.Text>
        <br />
        <div className="bold text-xl">{payload[0].payload.rank}</div>
      </div>
    );
  };

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

  return (
    <>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="Games Total" value={stats.totalGames} />
        </Col>
        <Col span={6}>
          <Statistic title="Games Won" value={stats.wonGames} />
        </Col>
        <Col span={6}>
          <Statistic title="Victory Ratio" value={renderVictoryRatio(stats.victoryRatio)} />
        </Col>
        <Col span={6}>
          <Statistic
            title="Average Game Duration"
            value={`${(stats.averageGameDuration / 60).toFixed(2)} min`}
          />
        </Col>
      </Row>

      <Row gutter={16} className="mt-4">
        <Col span={6}>
          <Statistic title="Longest Winning Streak" value={stats.longestWinningStreak} />
        </Col>
        <Col span={6}>
          <Statistic title="Longest Losing Streak" value={stats.longestLosingStreak} />
        </Col>
      </Row>

      <Typography.Title level={4} className="mt-4">
        Rank History
      </Typography.Title>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={stats.rankHistory}>
          <YAxis type="number" domain={['auto', 'auto']} reversed={true} />
          <Tooltip
            content={renderRankHistoryTooltip}
            contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#6EACDA"
            strokeWidth={3}
            dot={{ r: 0, fill: '#6EACDA' }}
            activeDot={{ r: 3, fill: '#6EACDA' }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ResponsiveContainer>

      <TableComponent
        dataSource={stats.divisionVictoryRatios}
        columns={rankHistoryColumns}
        rowKey="division"
        title="Division Victory Ratio"
      />

      <TableComponent
        dataSource={stats.enemyDivisionVictoryRatios}
        columns={rankHistoryColumns}
        rowKey="enemyDivision"
        title="Enemy Division Victory Ratio"
      />

      <TableComponent
        dataSource={stats.mostFrequentOpponents}
        columns={[
          createColumn('Enemy Division', 'enemyDivision', 'enemyDivision'),
          createColumn('Count', 'count', 'count', undefined, (a, b) => a.count - b.count)
        ]}
        rowKey="enemyDivision"
        title="Most Frequent Opponents"
      />

      <TableComponent
        dataSource={stats.mapVictoryRatios}
        columns={mapVictoryRatioColumns}
        rowKey="map"
        title="Map Victory Ratio"
      />
    </>
  );
};
