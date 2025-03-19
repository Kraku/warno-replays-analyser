import { Select, SelectProps } from 'antd';
import { GetWarnoSaveFolders } from '../../wailsjs/go/main/App';
import { useEffect, useState } from 'react';

type DirectoriesSelectProps = {
  directories: string[];
  setDirectories: (directories: string[]) => void;
};

export const DirectoriesSelect = ({ directories, setDirectories }: DirectoriesSelectProps) => {
  const [options, setOptions] = useState<SelectProps<string>['options']>([]);

  useEffect(() => {
    const getFolders = async () => {
      const data = await GetWarnoSaveFolders();
      const folders: Record<string, string> = JSON.parse(data);

      const newOptions = Object.keys(folders).map((folder) => ({
        label: (
          <div>
            {folder} <span className="text-neutral-500">{folders[folder]}</span>
          </div>
        ),
        value: folders[folder]
      }));

      setOptions(newOptions);

  
      if (directories.length === 0 && newOptions.length > 0) {
        setDirectories(newOptions.map((option) => option.value));
      }
    };

    getFolders();
  }, []);

  const handleChange = (value: string[]) => {
    setDirectories(value);
  };

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%' }}
      placeholder="Select one or more account directories"
      value={directories}
      onChange={handleChange}
      options={options}
    />
  );
};
