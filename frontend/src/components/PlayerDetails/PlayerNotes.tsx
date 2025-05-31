import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { Player } from '../../parsers/playersParser';
import { CreatePlayerNote, DeletePlayerNote, GetPlayerNotes } from '../../../wailsjs/go/main/App';

dayjs.extend(relativeTime);

type PlayerNote = {
  id: string;
  content: string;
  createdAt: string;
};

export const PlayerNotes = ({ player }: { player: Player }) => {
  const [note, setNote] = useState<string>('');
  const [notes, setNotes] = useState<PlayerNote[]>([]);

  const fetchNotes = async () => {
    const data = await GetPlayerNotes(player.id);
    const notes = JSON.parse(data);

    setNotes(notes || []);
  };

  useEffect(() => {
    fetchNotes();
  }, [player.id]);

  const handleNewNote = async () => {
    await CreatePlayerNote(player.id, note);
    fetchNotes();

    setNote('');
  };

  const handleDeleteNote = async (id: string) => {
    await DeletePlayerNote(player.id, id);
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
