import { Button, DatePicker, Drawer, Form, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useForm } from 'antd/es/form/Form';
import { SaveSettings, GetSettings, GetPlayerIdsOptions } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

export const SettingsDrawer = ({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: () => void;
}) => {
  const [form] = useForm();
  const [options, setOptions] = useState<main.PlayerIdsOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const [settings, data] = await Promise.all([GetSettings(), GetPlayerIdsOptions()]);

        form.setFieldsValue({
          playerIds: settings.playerIds,
          startDate: settings.startDate ? dayjs(settings.startDate) : undefined
        });

        setOptions(data);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleSave = async () => {
    const {
      playerIds,
      startDate
    }: {
      playerIds?: string[];
      startDate?: Dayjs;
    } = form.getFieldsValue(true);

    const params: {
      playerIds?: string[];
      startDate?: string;
    } = {
      playerIds: playerIds ? playerIds : []
    };

    if (startDate) {
      params.startDate = startDate.toISOString();
    }

    await SaveSettings(params);

    onSave();
  };

  return (
    <Drawer
      title="Settings"
      open={true}
      onClose={onClose}
      loading={loading}
      maskClosable={false}
      footer={
        <div className="flex justify-end gap-2 py-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      }>
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Player IDs"
          name="playerIds"
          extra="Choose your Eugen account IDs to exclude other players replays. When empty, all replays will be shown.">
          <Select
            mode="multiple"
            allowClear
            placeholder="Select one or more Eugen accounts"
            options={options.map((item) => ({
              label: (
                <div>
                  {item.value} <span className="text-neutral-500">{item.label}</span>
                </div>
              ),
              value: item.value
            }))}
          />
        </Form.Item>
        <Form.Item
          label="Start Date"
          name="startDate"
          extra="Only replays after this date will be shown.">
          <DatePicker
            showTime
            onOk={() => {}}
            className="w-full"
            needConfirm={false}
            showNow={false}
            presets={[
              {
                label: 'Last reset',
                value: dayjs('2025-02-28 08:25', 'YYYY-MM-DD HH:mm')
              }
            ]}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
