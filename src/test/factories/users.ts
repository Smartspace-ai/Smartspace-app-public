import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


import type { ThreadUser } from '@/domains/thread-users/model';

export const makeAppUser = (
  overrides: Partial<ChatModels.UsersAppUser> = {}
): ChatModels.UsersAppUser => ({
  ...fake(ChatZod.workSpacesGetUsersResponseItem),
  ...overrides,
});

// ThreadUser is a local domain model — its shape matches the thread-users API
// response item, so we fake from that schema and cast.
export const makeThreadUser = (
  overrides: Partial<ThreadUser> = {}
): ThreadUser => ({
  ...fake(ChatZod.messageThreadsGetThreadUsersResponseItem),
  ...overrides,
});
