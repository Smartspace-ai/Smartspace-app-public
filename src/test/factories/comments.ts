import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


import type { Comment, MentionUser } from '@/domains/comments/model';

const commentSummarySchema =
  ChatZod.messageThreadsGetCommentsResponse.shape.data.element;

export const makeCommentSummary = (
  overrides: Partial<ChatModels.CommentCommentSummary> = {}
): ChatModels.CommentCommentSummary => ({
  ...fake(commentSummarySchema),
  ...overrides,
});

// MentionUser is a local domain model with no API schema — built manually.
export const makeMentionUser = (
  overrides: Partial<MentionUser> = {}
): MentionUser => ({
  id: crypto.randomUUID(),
  displayName: '',
  initials: null,
  ...overrides,
});

export const makeComment = (overrides: Partial<Comment> = {}): Comment => {
  const dto = fake(commentSummarySchema);
  return {
    id: dto.id,
    messageThreadId: dto.messageThreadId,
    content: dto.content,
    createdAt: new Date(dto.createdAt),
    createdBy: dto.createdBy ?? '',
    createdByUserId: dto.createdByUserId ?? '',
    mentionedUsers: [],
    ...overrides,
  };
};
