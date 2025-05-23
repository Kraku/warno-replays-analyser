import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { Team } from '../../parsers/teamsParser';
import { CreateTeamNote, DeleteTeamNote, GetTeamNotes } from '../../../wailsjs/go/main/App';

dayjs.extend(relativeTime);

type TeamNote = {
  id: string;
  content: string;
  createdAt: string;
};

export const TeamNotes = ({ team }: { team: Team }) => {
  const [note, setNote] = useState<string>('');
  const [notes, setNotes] = useState<TeamNote[]>([]);

  const fetchNotes = async () => {
    const data = await GetTeamNotes(team.player1Id, team.player2Id);
    const notes = JSON.parse(data);

    setNotes(notes || []);
  };

  useEffect(() => {
    fetchNotes();
  }, [team.player1Id, team.player2Id]);

  const handleNewNote = async () => {
    await CreateTeamNote(team.player1Id, team.player2Id, note);
    fetchNotes();

    setNote('');
  };

  const handleDeleteNote = async (id: string) => {
    await DeleteTeamNote(team.player1Id, team.player2Id, id);
    fetchNotes();
  };

  return (
    <div>
      <Typography.Title level={5} className="mb-2">
        Notes
      </Typography.Title>

      <ul className="flex flex-col list-disc list-inside gap-1">
        {notes.map(({ id, content, createdAt }) => (
          <li key={id}>
            <Typography.Text type="secondary">
              {dayjs(createdAt).format('DD/MM/YYYY HH:mm')} ({dayjs(createdAt).fromNow()})
            </Typography.Text>{' '}
            {content}
            <DeleteOutlined className="ml-2 cursor-pointer" onClick={() => handleDeleteNote(id)} />
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 mt-4">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleNewNote();
            }
          }}
        />
        <Button onClick={() => handleNewNote()} icon={<SendOutlined />} />
      </div>
    </div>
  );
};
