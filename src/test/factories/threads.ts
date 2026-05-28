import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


const threadSummarySchema = ChatZod.workSpacesThreadResponse.shape.data.element;

export const makeThreadSummary = (
  overrides: Partial<ChatModels.MessageThreadMessageThreadSummary> = {}
): ChatModels.MessageThreadMessageThreadSummary => ({
  ...fake(threadSummarySchema),
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
