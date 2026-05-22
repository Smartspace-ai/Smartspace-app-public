import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import type { MentionUser } from '@/domains/comments/model';
import type { ThreadUser } from '@/domains/thread-users/model';

import { uuid } from './primitives';

export const makeAppUser = (
  overrides: Partial<ChatModels.UsersAppUser> = {}
): ChatModels.UsersAppUser => ({
  id: uuid(),
  userId: uuid(),
  displayName: faker.person.fullName(),
  emailAddress: faker.internet.email(),
  ...overrides,
});

export const makeMentionUser = (
  overrides: Partial<MentionUser> = {}
): MentionUser => ({
  id: uuid(),
  displayName: faker.person.fullName(),
  initials: null,
  ...overrides,
});

export const makeThreadUser = (
  overrides: Partial<ThreadUser> = {}
): ThreadUser => ({
  id: uuid(),
  userId: uuid(),
  displayName: faker.person.fullName(),
  emailAddress: faker.internet.email(),
  ...overrides,
});
