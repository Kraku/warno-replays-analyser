import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  InputNumber,
  Row,
  Select,
  Spin,
  Statistic,
  Table
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { GetRankedReplaysAnalytics } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

import divisionsData from '../data/divisions.json';
import mapsData from '../data/maps.json';

type DivisionRow = main.DivisionWinrateRow;

const formatWinRate = (value?: number) => {
  if (value == null || !Number.isFinite(value)) return '-';
  // Backends sometimes return either 0..1 or 0..100. Handle both.
  const normalized = value <= 1.00001 ? value * 100 : value;
  return `${normalized.toFixed(2)}%`;
};

const divisionLabel = (divisionId: number, divisionNameById: Map<number, string>) => {
  const name = divisionNameById.get(divisionId);

  return name ? name : divisionId;
};

const mapLabel = (mapKey: string, mapNameByKey: Map<string, string>) => {
  const name = mapNameByKey.get(mapKey);
  return name ?? mapKey;
};

export const GlobalStats = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<main.RankedReplaysAnalyticsResponse | null>(null);

  const [filterMaxRank, setFilterMaxRank] = useState<number>(0);
  const [filterMinElo, setFilterMinElo] = useState<number>(0);

  // Unified dropdowns
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null); // optional
  const [selectedMap, setSelectedMap] = useState<string | null>(null); // optional

  const fetchAnalytics = async (maxRank: number, minElo: number) => {
    try {
      setLoading(true);
      const data = await GetRankedReplaysAnalytics(maxRank, minElo);
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics(0, 0);
  }, []);

  const divisionNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of divisionsData as Array<{ id: number; name: string }>) {
      map.set(d.id, d.name);
    }
    return map;
  }, []);

  const mapNameByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const [key, value] of Object.entries(mapsData as Record<string, string>)) {
      map.set(key, value);
    }
    return map;
  }, []);

  const divisions = analytics?.divisions ?? [];

  const availableDivisions = useMemo(() => {
    const ids = (analytics?.divisions ?? []).map((d) => d.division);
    ids.sort((a, b) => a - b);
    return ids;
  }, [analytics?.divisions]);

  const availableMaps = useMemo(() => {
    const keys = Array.from(
      new Set([
        ...(analytics?.divisionOnMap ?? []).map((g) => g.map),
        ...(analytics?.divisionOnMapVs ?? []).map((g) => g.map)
      ])
    );
    keys.sort((a, b) => (a || '').localeCompare(b || ''));
    return keys;
  }, [analytics?.divisionOnMap, analytics?.divisionOnMapVs]);

  const availableOpponents = useMemo(() => {
    if (selectedDivision == null) return [];

    if (selectedMap) {
      const mapGroup = (analytics?.divisionOnMapVs ?? []).find((g) => g.map === selectedMap);
      const divGroup = mapGroup?.divisions.find((d) => d.division === selectedDivision);
      const ids = (divGroup?.opponents ?? [])
        .map((o) => o.opponentDivision)
        .filter((id) => id !== selectedDivision);
      ids.sort((a, b) => a - b);
      return ids;
    } else {
      const divGroup = (analytics?.divisionVs ?? []).find((g) => g.division === selectedDivision);
      const ids = (divGroup?.opponents ?? [])
        .map((o) => o.opponentDivision)
        .filter((id) => id !== selectedDivision);
      ids.sort((a, b) => a - b);
      return ids;
    }
  }, [analytics, selectedDivision, selectedMap]);

  useEffect(() => {
    if (!analytics) return;
    setSelectedDivision((prev) =>
      prev != null && availableDivisions.includes(prev) ? prev : (availableDivisions[0] ?? null)
    );
    setSelectedMap((prev) => (prev != null && availableMaps.includes(prev) ? prev : null));
    setSelectedOpponent((prev) => {
      if (prev != null && availableOpponents.includes(prev)) return prev;
      return null;
    });
  }, [analytics, availableDivisions, availableMaps, availableOpponents]);

  useEffect(() => {
    setSelectedOpponent((prev) => {
      if (prev == null) return null;
      return availableOpponents.includes(prev) ? prev : null;
    });
  }, [availableOpponents]);

  const statsRow = useMemo(() => {
    if (!selectedDivision) return null;

    if (selectedMap && selectedOpponent) {
      const mapGroup = (analytics?.divisionOnMapVs ?? []).find((g) => g.map === selectedMap);
      const divGroup = mapGroup?.divisions.find((d) => d.division === selectedDivision);
      const opp = divGroup?.opponents.find((o) => o.opponentDivision === selectedOpponent);

      if (!opp) {
        const mapDiv = (analytics?.divisionOnMap ?? [])
          .find((g) => g.map === selectedMap)
          ?.divisions.find((d) => d.division === selectedDivision);
        return mapDiv ?? null;
      }
      return opp;
    }
    if (selectedMap && !selectedOpponent) {
      const mapGroup = (analytics?.divisionOnMap ?? []).find((g) => g.map === selectedMap);
      return mapGroup?.divisions.find((d) => d.division === selectedDivision) ?? null;
    }
    if (!selectedMap && selectedOpponent) {
      const divGroup = (analytics?.divisionVs ?? []).find((g) => g.division === selectedDivision);
      return divGroup?.opponents.find((o) => o.opponentDivision === selectedOpponent) ?? null;
    }
    if (!selectedMap && !selectedOpponent) {
      return (analytics?.divisions ?? []).find((d) => d.division === selectedDivision) ?? null;
    }
    return null;
  }, [analytics, selectedDivision, selectedOpponent, selectedMap]);

  const commonStatColumns = <
    T extends {
      games: number;
      nonDrawGames: number;
      wins: number;
      losses: number;
      draws: number;
      winRate: number;
    }
  >(): ColumnsType<T> => [
    {
      title: 'Games',
      dataIndex: 'games',
      sorter: (a, b) => a.games - b.games,
      filters: [
        { text: '≥ 10', value: '10' },
        { text: '≥ 25', value: '25' },
        { text: '≥ 50', value: '50' },
        { text: '≥ 100', value: '100' },
        { text: '≥ 500', value: '500' },
        { text: '≥ 1000', value: '1000' }
      ],
      onFilter: (value, record) => record.games >= Number(value),
      width: 90
    },
    {
      title: 'Non-draw',
      dataIndex: 'nonDrawGames',
      sorter: (a, b) => a.nonDrawGames - b.nonDrawGames,
      width: 110
    },
    {
      title: 'Wins',
      dataIndex: 'wins',
      sorter: (a, b) => a.wins - b.wins,
      width: 90
    },
    {
      title: 'Losses',
      dataIndex: 'losses',
      sorter: (a, b) => a.losses - b.losses,
      width: 90
    },
    {
      title: 'Draws',
      dataIndex: 'draws',
      sorter: (a, b) => a.draws - b.draws,
      width: 90
    },
    {
      title: 'Win rate',
      dataIndex: 'winRate',
      sorter: (a, b) => a.winRate - b.winRate,
      render: (value: number) => <span className="tabular-nums">{formatWinRate(value)}</span>,
      width: 110
    }
  ];

  const divisionsColumns: ColumnsType<DivisionRow> = useMemo(
    () => [
      {
        title: 'Division',
        dataIndex: 'division',
        sorter: (a, b) => a.division - b.division,
        render: (value: number) => divisionLabel(value, divisionNameById)
      },
      ...commonStatColumns<DivisionRow>()
    ],
    [divisionNameById]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic title="Total games" value={analytics?.totalGames ?? 0} />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic title="Unique submitters" value={analytics?.uniqueSubmitters ?? 0} />
              </Col>
            </Row>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-4 justify-end">
            <div>
              <div className="text-xs text-neutral-400 mb-1">Players rank</div>
              <Select<number>
                style={{ width: 220 }}
                value={filterMaxRank}
                options={[
                  { value: 0, label: 'All ranks' },
                  { value: 50, label: 'Top 50' },
                  { value: 100, label: 'Top 100' },
                  { value: 200, label: 'Top 200' },
                  { value: 500, label: 'Top 500' },
                  { value: 1000, label: 'Top 1000' }
                ]}
                onChange={(value) => setFilterMaxRank(value)}
              />
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Players min elo</div>
              <InputNumber
                style={{ width: 160 }}
                value={filterMinElo}
                min={0}
                step={50}
                onChange={(value) => setFilterMinElo(Number(value || 0))}
              />
            </div>
            <div className="flex items-end gap-2 pt-5 md:pt-0">
              <Button
                type="primary"
                loading={loading}
                onClick={() => {
                  void fetchAnalytics(filterMaxRank, filterMinElo);
                }}>
                Apply
              </Button>
              <Button
                disabled={loading}
                onClick={() => {
                  setFilterMaxRank(0);
                  setFilterMinElo(0);
                  void fetchAnalytics(0, 0);
                }}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        </Card>
      ) : null}

      <Card title="Division win rates">
        <Table
          size="small"
          rowKey={(r) => `div-${r.division}`}
          columns={divisionsColumns}
          dataSource={divisions}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Card title="Division/Opponent/Map stats">
        {!analytics ? (
          <Empty description="No data" />
        ) : (
          <div className="flex flex-col gap-4">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={8}>
                <div className="text-xs text-neutral-400 mb-1">Division</div>
                <Select<number>
                  className="w-full"
                  value={selectedDivision ?? undefined}
                  options={availableDivisions.map((id) => ({
                    value: id,
                    label: divisionLabel(id, divisionNameById)
                  }))}
                  onChange={(value) => setSelectedDivision(value)}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs text-neutral-400 mb-1">Opponent</div>
                <Select<number | null>
                  className="w-full"
                  value={selectedOpponent ?? null}
                  options={[
                    { value: null, label: 'Any' },
                    ...availableOpponents.map((id) => ({
                      value: id,
                      label: divisionLabel(id, divisionNameById)
                    }))
                  ]}
                  onChange={(value) => setSelectedOpponent(value)}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs text-neutral-400 mb-1">Map</div>
                <Select<string | null>
                  className="w-full"
                  value={selectedMap ?? null}
                  options={[
                    { value: null, label: 'Any' },
                    ...availableMaps.map((key) => ({
                      value: key,
                      label: mapLabel(key, mapNameByKey)
                    }))
                  ]}
                  onChange={(value) => setSelectedMap(value)}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
            </Row>

            {statsRow ? (
              <Row gutter={[16, 16]} align="middle" className="mt-2">
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Statistic title="Games" value={statsRow?.games ?? 0} />
                </Col>
                <Col xs={24} sm={8} md={8} lg={4}>
                  <Statistic title="Wins" value={statsRow?.wins ?? 0} />
                </Col>
                <Col xs={24} sm={8} md={8} lg={4}>
                  <Statistic title="Losses" value={statsRow?.losses ?? 0} />
                </Col>
                <Col xs={24} sm={8} md={8} lg={4}>
                  <Statistic title="Draws" value={statsRow?.draws ?? 0} />
                </Col>
                <Col xs={24} sm={12} md={12} lg={4}>
                  <Statistic
                    title="Win rate"
                    value={
                      statsRow?.winRate != null
                        ? Number(
                            (statsRow.winRate <= 1.00001
                              ? statsRow.winRate * 100
                              : statsRow.winRate
                            ).toFixed(2)
                          )
                        : 0
                    }
                    suffix="%"
                  />
                </Col>
              </Row>
            ) : (
              <div className="text-neutral-400 text-center py-4">No data for this selection.</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
