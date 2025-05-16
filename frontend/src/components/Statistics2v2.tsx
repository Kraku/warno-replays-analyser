import { Col, Row, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Statistics2v2 } from '../stats';
import { renderVictoryRatio } from '../helpers/renderVictoryRatio';

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

export const Stats2v2 = ({ stats }: { stats: Statistics2v2 }) => {
  if (!stats) {
    return null;
  }

  const bestAllyColumns = [
    createColumn('Name', 'name', 'name', undefined, (a, b) =>
      a.playerName.localeCompare(b.playerName)
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

  const bestAllyDivisionColumns = [
    createColumn('YourDivision', 'yourDivision', 'yourDivision', undefined, (a, b) =>
      a.playerDivision.localeCompare(b.playerDivision)
    ),
    createColumn('AllyDivision', 'allyDivision', 'allyDivision', undefined, (a, b) =>
      a.allyDivision.localeCompare(b.allyDivision)
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

  const strongestTeamsColumns = [
    createColumn('Player1Name', 'player1Name', 'player1Name', undefined, (a, b) =>
      a.enemyPlayer1Name.localeCompare(b.enemyPlayer1Name)
    ),
    createColumn('Player2Name', 'player2Name', 'player2Name', undefined, (a, b) =>
      a.enemyPlayer2Name.localeCompare(b.enemyPlayer2Name)
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

  const strongestTeamDivisionsColumns = [
    createColumn('Division1', 'division1', 'division1', undefined, (a, b) =>
      a.enemyDivision1.localeCompare(b.enemyDivision1)
    ),
    createColumn('Player2Name', 'player2Name', 'player2Name', undefined, (a, b) =>
      a.enemyDivision2.localeCompare(b.enemyDivision2)
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

      <TableComponent
        dataSource={stats.alliedTeamVictoryRatios}
        columns={bestAllyColumns}
        rowKey="allies"
        title="Best Allies"
      />

      <TableComponent
        dataSource={stats.alliedTeamDivisionVictoryRatios}
        columns={bestAllyDivisionColumns}
        rowKey="allyDivisions"
        title="Best Allied Division Pairings"
      />

      <TableComponent
        dataSource={stats.enemyTeamVictoryRatios}
        columns={strongestTeamsColumns}
        rowKey="enemies"
        title="Strongest Enemy Teams"
      />

      <TableComponent
        dataSource={stats.enemyTeamDivisionVictoryRatios}
        columns={strongestTeamDivisionsColumns}
        rowKey="enemyDivisions"
        title="Strongest Enemy Division Pairings"
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