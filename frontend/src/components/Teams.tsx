import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { List, Input, Button, Card, Empty, Typography } from 'antd';
import { ArrowRightOutlined, CopyOutlined } from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { transliterate } from '../helpers/transliterate';
import { Team, TeamHistory, teamsParser } from '../parsers/teamsParser';
import { Replay2v2 } from '../parsers/replaysParser';
import { renderVictoryRatio } from '../helpers/renderVictoryRatio';
import { TeamDetails } from './TeamDetails/TeamDetails';

dayjs.extend(relativeTime);

const columns: ColumnType<TeamHistory>[] = [
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => `${dayjs(value).format('DD/MM/YYYY HH:mm')} (${dayjs(value).fromNow()})`
  },
  {
    title: 'My Division',
    dataIndex: 'division',
    key: 'division'
  },
  {
    title: 'Ally Division',
    dataIndex: 'allyDivision',
    key: 'allyDivision'
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
    render: (value: number) => dayjs.duration(value, 'seconds').format('mm:ss')
  },
  {
    title: 'Map',
    dataIndex: 'map',
    key: 'map'
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'result'
  }
];

export const Teams = ({ replays }: { replays: Replay2v2[] }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>();

  useEffect(() => {
    const fetchTeams = async () => {
      const parsedTeams = teamsParser(replays);
      setTeams(parsedTeams);
    };

    fetchTeams();
  }, [replays]);


  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    setSearchQuery(query);
  };

  const filteredTeams = teams.filter((team) => {
    const normalizedQuery = transliterate(searchQuery.toLowerCase());

    return (
      team.player1Names.some((name) => transliterate(name.toLowerCase()).includes(normalizedQuery)) ||
      team.player2Names.some((name) => transliterate(name.toLowerCase()).includes(normalizedQuery)) ||
      transliterate(team.player1Id.toLowerCase()).includes(normalizedQuery) ||
      transliterate(team.player2Id.toLowerCase()).includes(normalizedQuery)
    );
  });

  const selectedTeamData = teams
    .find((team) => JSON.stringify([team.player1Id, team.player2Id]) === selectedTeam);

  return (
    <div className="flex gap-4">
      <div className="w-1/5">
        <Input.Search
          className="mb-4"
          placeholder="Filter teams by name or id"
          value={searchQuery}
          onChange={handleSearch}
          allowClear
        />
        <div className="max-h-[calc(100vh-23rem)] overflow-y-auto pr-2">
          <List
            dataSource={filteredTeams}
            size="small"
            renderItem={(team) => {
              return (
                <List.Item
                  actions={[
                    <Button
                      icon={<ArrowRightOutlined />}
                      onClick={() => setSelectedTeam(JSON.stringify([team.player1Id, team.player2Id]))}
                      key="open"
                    />
                  ]}
                  className={selectedTeam === JSON.stringify([team.player1Id, team.player2Id]) ? 'bg-neutral-800' : 'hover:bg-neutral-900'}
                  key={JSON.stringify([team.player1Id, team.player2Id])}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex gap-1 items-center">
                        <Typography.Text strong>`{team.getPlayer1CommonName()}, {team.getPlayer2CommonName()}`</Typography.Text>
                      </div>
                    }
                    description={(
                      <div className="flex items-center">
                        <div className='w-2 h-2 rounded-full mr-1'>
                        {`games: ${team.getGamesCount()}`}
                        </div>
                        <div className='w-2 h-2 rounded-full mr-1'>
                        {`WR: ${renderVictoryRatio(team.getVictoryRatio())}%`}
                        </div>
                      </div>
                    )}
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
      <div className="w-4/5">
        {selectedTeamData ? (
          <TeamDetails team={selectedTeamData} />
        ) : (
          <Card>
            <Empty description="Select a team" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        )}
      </div>
    </div>
  );
};
