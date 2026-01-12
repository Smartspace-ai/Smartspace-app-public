import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export function parseDateTime(date: Date | string, customFormat?: string): string {
  const d = dayjs.utc(date).local();

  // Keep compatibility with moment's common unix tokens.
  if (customFormat === 'X') return Math.floor(d.valueOf() / 1000).toString();
  if (customFormat === 'x') return d.valueOf().toString();

  return d.format(customFormat ?? 'YYYY-MM-DD HH:mm:ss');
}

export function parseDateTimeHuman(date: Date | string): string {
  return dayjs.utc(date).local().fromNow();
}

export default parseDateTime;
