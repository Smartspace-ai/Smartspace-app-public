import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import { isoDate, oneOf, uuid } from './primitives';

export const makeMessageValue = (
  overrides: Partial<ChatModels.MessagesMessageValue> = {}
): ChatModels.MessagesMessageValue => ({
  id: uuid(),
  name: 'text',
  type: oneOf(['Input', 'Output'] as const),
  createdAt: isoDate(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  channels: {},
  value: faker.lorem.paragraph(),
  ...overrides,
});

export const makeMessage = (
  overrides: Partial<ChatModels.MessagesMessage> = {}
): ChatModels.MessagesMessage => ({
  id: uuid(),
  createdAt: isoDate(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  messageThreadId: uuid(),
  hasComments: false,
  errors: [],
  values: [makeMessageValue({ type: 'Output' })],
  ...overrides,
});
