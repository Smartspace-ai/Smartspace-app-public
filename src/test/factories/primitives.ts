import { faker } from '@faker-js/faker';

export const uuid = () => faker.string.uuid();

export const isoDate = () => faker.date.recent({ days: 30 }).toISOString();
