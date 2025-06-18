import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
export const formatDuration = (seconds: number) => {
  const dur = dayjs.duration(seconds, 'seconds');
  const days = dur.days();
  const hours = dur.hours();
  const minutes = dur.minutes();

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};
