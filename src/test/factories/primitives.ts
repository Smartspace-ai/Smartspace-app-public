import { faker } from '@faker-js/faker';

export const uuid = () => faker.string.uuid();

export const isoDate = () => faker.date.recent({ days: 30 }).toISOString();

export const pastIsoDate = () => faker.date.past({ years: 1 }).toISOString();

export const oneOf = <T>(arr: readonly T[]): T =>
  arr[faker.number.int({ min: 0, max: arr.length - 1 })];
