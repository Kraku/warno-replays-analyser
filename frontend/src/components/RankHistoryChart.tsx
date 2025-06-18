import { useState, useMemo } from 'react';
import { Select } from 'antd';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, Brush } from 'recharts';
import dayjs from 'dayjs';
import { RankHistory } from '../stats';

const { Option } = Select;

const RANGE_OPTIONS = [
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
  { label: 'All Time', value: 'all' }
];

export default function RankHistoryChart({ rankHistory }: { rankHistory: RankHistory }) {
  const [range, setRange] = useState('30');

  const filteredData = useMemo(() => {
    if (range === 'all') return rankHistory;
    const cutoff = dayjs().subtract(Number(range), 'day');
    return rankHistory.filter((item) => dayjs(item.date).isAfter(cutoff));
  }, [rankHistory, range]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end">
        <Select value={range} onChange={setRange} className="w-[140px]" size="middle">
          {RANGE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={filteredData}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => dayjs(d).format('MMM D')}
            tick={{ fontSize: 12 }}
          />
          <YAxis type="number" domain={['auto', 'auto']} reversed tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(label) => dayjs(label).format('MMM D, YYYY')}
            contentStyle={{
              backgroundColor: '#333',
              borderColor: '#333',
              color: '#fff'
            }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#6EACDA"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 3, fill: '#6EACDA' }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Brush
            dataKey="date"
            height={20}
            stroke="#a3a3a3"
            fill="#262626"
            travellerWidth={10}
            tickFormatter={(d) => dayjs(d).format('MMM D')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
