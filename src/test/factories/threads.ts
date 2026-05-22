import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import { isoDate, uuid } from './primitives';

export const makeThreadSummary = (
  overrides: Partial<ChatModels.MessageThreadMessageThreadSummary> = {}
): ChatModels.MessageThreadMessageThreadSummary => ({
  id: uuid(),
  workSpaceId: uuid(),
  name: faker.lorem.words(3),
  createdAt: isoDate(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  lastUpdatedAt: isoDate(),
  lastUpdatedByUserId: uuid(),
  lastUpdated: null,
  favorited: false,
  isFlowRunning: false,
  totalMessages: faker.number.int({ min: 0, max: 50 }),
  ...overrides,
});

export const makeThreadsResponse = (
  threads: ChatModels.MessageThreadMessageThreadSummary[] = [
    makeThreadSummary(),
  ]
): ChatModels.PagedDataCollectionMessageThreadMessageThreadSummary => ({
  data: threads,
  total: threads.length,
});
