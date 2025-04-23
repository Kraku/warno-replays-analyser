import { useEffect, useState } from 'react';
import { GetAppVersions } from '../../wailsjs/go/main/App';
import { Button, Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LinkOutlined } from '@ant-design/icons';

import { versionOutdated } from './../helpers/version';

dayjs.extend(relativeTime);

export const Version = () => {
  const [versions, setVersions] = useState<[string, string]>();

  useEffect(() => {
    const fetchAppVersions = async (): Promise<void> => {
      const [appVersion, latestVersion] = await GetAppVersions();
      setVersions([appVersion, latestVersion]);
    };

    fetchAppVersions();

    const interval = setInterval(() => {
      fetchAppVersions();
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  return versions && versionOutdated(...versions) ? (
    <Tag>
      <div className="flex items-center">
        New version available: {versions[1]}
        <Button
          type="link"
          size="small"
          href="https://github.com/Kraku/warno-replays-analyser/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          icon={<LinkOutlined />}
        />
      </div>
    </Tag>
  ) : null;
};
