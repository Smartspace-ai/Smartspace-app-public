import moment from 'moment';

export function parseDateTime(
  date: Date | string,
  customFormat?: string
): string {
  // eslint-disable-next-line import/no-named-as-default-member
  const utcMoment = moment.utc(date);
  const localMoment = utcMoment.local();
  return localMoment.format(customFormat ?? 'YYYY-MM-DD HH:mm:ss');
}

export function parseDateTimeHuman(date: Date | string): string {
  // eslint-disable-next-line import/no-named-as-default-member
  return moment.utc(date).local().fromNow();
}

export default parseDateTime;
