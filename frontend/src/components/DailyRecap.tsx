import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, DescriptionsProps, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { EugenUser } from '../parsers/replaysParser';
import { main } from '../../wailsjs/go/models';
import { GetDailyRecap, GetSettings, SaveSettings } from '../../wailsjs/go/main/App';

interface DailyRecapProps {
  eugenUsers: EugenUser[];
}

export const DailyRecap = ({ eugenUsers = [] }: DailyRecapProps) => {
  const [selectedUser, setSelectedUser] = useState<string>();
  const [settings, setSettings] = useState<main.Settings>();
  const [stats, setStats] = useState<main.DailyRecap>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      const savedSettings = await GetSettings();
      const fallbackUserId = eugenUsers[0]?.eugenId;
      const userId = savedSettings.dailyRecapUser || fallbackUserId;

      if (!userId) return;

      const exists = !savedSettings.dailyRecapUser;
      const updatedSettings = exists ? { ...savedSettings, dailyRecapUser: userId } : savedSettings;

      if (exists) {
        await SaveSettings(updatedSettings);
      }

      setSettings(updatedSettings);
      setSelectedUser(userId);

      await fetchStats(userId);
    };

    initialize();
  }, [eugenUsers]);

  const fetchStats = async (eugenId: string) => {
    setIsLoading(true);

    try {
      const data = await GetDailyRecap(eugenId);

      setStats(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserChange = async (userId: string) => {
    setSelectedUser(userId);
    if (settings) {
      await SaveSettings({ ...settings, dailyRecapUser: userId });
    }
    await fetchStats(userId);
  };

  const descriptionItems: DescriptionsProps['items'] = [
    { key: 'elo', label: 'Elo Change', children: stats?.eloChange ?? 0 },
    { key: 'games', label: 'Games Played', children: stats?.gamesPlayed ?? 0 },
    { key: 'wins', label: 'Wins', children: stats?.wins ?? 0 },
    { key: 'losses', label: 'Losses', children: stats?.losses ?? 0 }
  ];

  const userOptions = eugenUsers.map(({ eugenId, playerNames }) => ({
    label: playerNames.join(', '),
    value: eugenId
  }));

  const extraControls = (
    <div className="flex items-center gap-2 w-42">
      <Select
        size="small"
        className="w-full"
        options={userOptions}
        value={selectedUser}
        onChange={handleUserChange}
        disabled={isLoading}
      />
      <Button
        type="text"
        size="small"
        icon={<ReloadOutlined spin={isLoading} />}
        disabled={!selectedUser || isLoading}
        onClick={() => selectedUser && fetchStats(selectedUser)}
      />
    </div>
  );

  return (
    <Card size="small" title="Daily Recap" extra={extraControls}>
      <Spin spinning={isLoading}>
        <Descriptions items={descriptionItems} column={4} size="small" />
      </Spin>
    </Card>
  );
};
