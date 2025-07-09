import { Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { GetSettings, SaveSettings } from '../../../wailsjs/go/main/App';
import { useReplayContext } from '../../contexts/ReplayContext';

type SeasonKey = 'Season 1' | 'Season 2' | 'Season 3';

const seasonPresets: Record<SeasonKey, [dayjs.Dayjs | null, dayjs.Dayjs | null]> = {
  'Season 1': [null, dayjs('2025-02-28 08:24', 'YYYY-MM-DD HH:mm')],
  'Season 2': [
    dayjs('2025-02-28 08:25', 'YYYY-MM-DD HH:mm'),
    dayjs('2025-07-07 09:59', 'YYYY-MM-DD HH:mm')
  ],
  'Season 3': [dayjs('2025-07-07 10:00', 'YYYY-MM-DD HH:mm'), null]
};

export const SeasonSelect = () => {
  const { refresh1v1Stats } = useReplayContext();

  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>();

  useEffect(() => {
    const loadInitialDateRange = async () => {
      const settings = await GetSettings();
      const from = settings.dateRangeFrom ? dayjs(settings.dateRangeFrom) : null;
      const to = settings.dateRangeTo ? dayjs(settings.dateRangeTo) : null;

      const matchedSeason = (
        Object.entries(seasonPresets) as [SeasonKey, [dayjs.Dayjs | null, dayjs.Dayjs | null]][]
      ).find(
        ([_, [pFrom, pTo]]) =>
          (pFrom?.isSame(from) ?? from === null) && (pTo?.isSame(to) ?? to === null)
      );

      setSelectedSeason(matchedSeason?.[0]);
    };

    loadInitialDateRange();
  }, []);

  const handleSeasonChange = async (seasonKey?: SeasonKey) => {
    setSelectedSeason(seasonKey);

    const settings = await GetSettings();

    let updatedSettings;
    if (seasonKey) {
      const [from, to] = seasonPresets[seasonKey];
      updatedSettings = {
        ...settings,
        dateRangeFrom: from?.toISOString(),
        dateRangeTo: to?.toISOString()
      };
    } else {
      const { dateRangeFrom, dateRangeTo, ...rest } = settings;
      updatedSettings = rest;
    }

    await SaveSettings(updatedSettings);
    refresh1v1Stats();
  };

  return (
    <Select
      placeholder="Select a season"
      allowClear
      onClear={() => handleSeasonChange()}
      value={selectedSeason}
      onChange={handleSeasonChange}
      style={{ width: 240 }}
      options={(Object.keys(seasonPresets) as SeasonKey[]).map((label) => ({
        label,
        value: label
      }))}
    />
  );
};
