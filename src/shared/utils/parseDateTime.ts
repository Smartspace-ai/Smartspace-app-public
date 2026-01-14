import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

// `eslint-plugin-import` can incorrectly warn that `extend` should be a named import.
// Dayjs exposes it as a method on the default export.
// eslint-disable-next-line import/no-named-as-default-member
dayjs.extend(utc);
// eslint-disable-next-line import/no-named-as-default-member
dayjs.extend(relativeTime);
// eslint-disable-next-line import/no-named-as-default-member
dayjs.extend(advancedFormat);

export function parseDateTime(
  date: Date | string,
  customFormat?: string
): string {
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
