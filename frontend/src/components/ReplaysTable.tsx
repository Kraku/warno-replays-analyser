import { Table } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Replay } from "../parser";

dayjs.extend(relativeTime);

import { ColumnType } from "antd/es/table";
import { Input } from "antd";
import { useState } from "react";

const { Search } = Input;

const columns: ColumnType<Replay>[] = [
  {
    title: "Time",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (value: string) =>
      `${dayjs(value).format("DD/MM/YYYY HH:mm")} (${dayjs(value).fromNow()})`,
    sorter: (a: Replay, b: Replay) =>
      dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
  },
  {
    title: "Result",
    dataIndex: "result",
    key: "result",
    filters: [
      { text: "Victory", value: "Victory" },
      { text: "Defeat", value: "Defeat" },
      { text: "Draw", value: "Draw" },
    ],
    onFilter: (value: boolean | React.Key, record: Replay) =>
      record.result.includes(String(value)),
    sorter: (a: Replay, b: Replay) => a.result.localeCompare(b.result),
  },
  {
    title: "Division",
    dataIndex: "division",
    key: "division",
    sorter: (a: Replay, b: Replay) =>
      (a.division || "").localeCompare(b.division || ""),
  },
  {
    title: "Enemy Name",
    dataIndex: "enemyName",
    key: "enemyName",
    sorter: (a: Replay, b: Replay) => a.enemyName.localeCompare(b.enemyName),
  },
  {
    title: "Enemy Division",
    dataIndex: "enemyDivision",
    key: "enemyDivision",
    sorter: (a: Replay, b: Replay) =>
      (a.enemyDivision || "").localeCompare(b.enemyDivision || ""),
  },
  {
    title: "Enemy Rank",
    dataIndex: "enemyRank",
    key: "enemyRank",
    sorter: (a: Replay, b: Replay) =>
      parseInt(a.enemyRank) - parseInt(b.enemyRank),
  },
];

export const ReplaysTable = ({ replays }: { replays: Replay[] }) => {
  const [searchText, setSearchText] = useState("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredReplays = replays.filter((replay) =>
    Object.values(replay).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <>
      <Search
        placeholder="Find enemy"
        onSearch={handleSearch}
        className="mb-2"
        allowClear
      />
      <Table
        dataSource={filteredReplays}
        columns={columns}
        size="small"
        pagination={false}
        rowKey="fileName"
      />
    </>
  );
};
