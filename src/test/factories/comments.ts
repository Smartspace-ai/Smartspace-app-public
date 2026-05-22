import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


const commentSummarySchema =
  ChatZod.messageThreadsGetCommentsResponse.shape.data.element;

export const makeCommentSummary = (
  overrides: Partial<ChatModels.CommentCommentSummary> = {}
): ChatModels.CommentCommentSummary => ({
  ...fake(commentSummarySchema),
  ...overrides,
});
