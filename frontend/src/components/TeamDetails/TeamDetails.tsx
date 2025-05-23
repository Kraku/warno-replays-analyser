import { Card, Typography, Tag } from 'antd';
import { Team } from '../../parsers/teamsParser';
import { TeamGamesTable } from './TeamGamesTable';
import { TeamNotes } from './TeamNotes';

export const TeamDetails = ({ team }: { team: Team }) => {
  return (
    <Card
      title={
        <div className="flex gap-2 items-center mb-2">
          <Typography.Text>{[team.getPlayer1CommonName(), team.getPlayer2CommonName()].join('& ')}</Typography.Text>
          <Tag bordered={false}>#{[team.player1Id, team.player2Id].join(' & ')}</Tag>
        </div>
      }>
      <div>
        <Typography.Title level={5} className="mb-2">
          Games History<span className="text-xs text-neutral-400 ml-2">(last 10)</span>
        </Typography.Title>

        <TeamGamesTable history={team.history} />

        <TeamNotes team={team} />
      </div>
    </Card>
  );
};
