import { faker } from '@faker-js/faker';
import type { ChatModels } from '@smartspace/api-client';

import type { Comment } from '@/domains/comments/model';

import { isoDate, uuid } from './primitives';

export const makeCommentSummary = (
  overrides: Partial<ChatModels.CommentCommentSummary> = {}
): ChatModels.CommentCommentSummary => ({
  id: uuid(),
  messageThreadId: uuid(),
  content: faker.lorem.sentence(),
  createdAt: isoDate(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  mentionedUsers: [],
  ...overrides,
});

export const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: uuid(),
  messageThreadId: uuid(),
  content: faker.lorem.sentence(),
  createdAt: new Date(),
  createdBy: faker.person.fullName(),
  createdByUserId: uuid(),
  mentionedUsers: [],
  ...overrides,
});
