import { Col, Row, Statistic, Table } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Statistics } from "../stats";

dayjs.extend(relativeTime);

export const Stats = ({ stats }: { stats: Statistics }) => {
  if (!stats) {
    return null;
  }

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
          <Statistic
            title="Victory Ratio"
            value={`${stats.victoryRatio.toFixed(2)}%`}
          />
        </Col>
      </Row>

      <Table
        className="mt-4"
        dataSource={stats.divisionVictoryRatios}
        columns={[
          {
            title: "Division",
            dataIndex: "division",
            key: "division",
            sorter: (a, b) => a.division.localeCompare(b.division),
            filters: Array.from(
              new Set(stats.divisionVictoryRatios.map((item) => item.division))
            ).map((division) => ({
              text: division,
              value: division,
            })),
            onFilter: (value, record) =>
              record.division.includes(value as string),
          },
          {
            title: "Victory Ratio",
            dataIndex: "victoryRatio",
            key: "victoryRatio",
            render: (value: number) => `${value.toFixed(2)}%`,
            sorter: (a, b) => a.victoryRatio - b.victoryRatio,
          },
          {
            title: "Games",
            dataIndex: "games",
            key: "games",
            sorter: (a, b) => a.games - b.games,
            filters: [
              { text: "More than 10 games", value: "moreThan10" },
              { text: "10 or less games", value: "10OrLess" },
            ],
            onFilter: (value, record) => {
              if (value === "moreThan10") {
                return record.games > 10;
              }
              if (value === "10OrLess") {
                return record.games <= 10;
              }
              return true;
            },
          },
        ]}
        size="small"
        pagination={false}
        rowKey="division"
      />

      <Table
        className="mt-4"
        dataSource={stats.enemyDivisionVictoryRatios}
        columns={[
          {
            title: "Enemy Division",
            dataIndex: "enemyDivision",
            key: "enemyDivision",
            sorter: (a, b) => a.enemyDivision.localeCompare(b.enemyDivision),
            filters: Array.from(
              new Set(
                stats.enemyDivisionVictoryRatios.map((item) => item.enemyDivision)
              )
            ).map((division) => ({
              text: division,
              value: division,
            })),
            onFilter: (value, record) =>
              record.enemyDivision.includes(value as string),
          },
          {
            title: "Victory Ratio",
            dataIndex: "victoryRatio",
            key: "victoryRatio",
            render: (value: number) => `${value.toFixed(2)}%`,
            sorter: (a, b) => a.victoryRatio - b.victoryRatio,
          },
          {
            title: "Games",
            dataIndex: "games",
            key: "games",
            sorter: (a, b) => a.games - b.games,
            filters: [
              { text: "More than 10 games", value: "moreThan10" },
              { text: "10 or less games", value: "10OrLess" },
            ],
            onFilter: (value, record) => {
              if (value === "moreThan10") {
                return record.games > 10;
              }
              if (value === "10OrLess") {
                return record.games <= 10;
              }
              return true;
            },
          },
        ]}
        size="small"
        pagination={false}
        rowKey="enemyDivision"
      />
    </>
  );
};
