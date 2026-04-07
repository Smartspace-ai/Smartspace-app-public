import type { z } from 'zod';

import {
  getMessageThreadsIdCommentsResponse as commentsResponseSchema,
  postMessageThreadsIdCommentsResponse as commentCreateResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { Comment, MentionUser } from './model';

type CommentsResponseDto = z.infer<typeof commentsResponseSchema>;
type CommentDto = CommentsResponseDto['data'][number];
type MentionUserDto = CommentDto['mentionedUsers'][number];
type CommentCreateDto = z.infer<typeof commentCreateResponseSchema>;

export function mapMentionUserDtoToModel(
  dto: MentionUserDto | string
): MentionUser {
  if (typeof dto === 'string') {
    return { id: dto, displayName: '', initials: null };
  }
  return {
    id: dto.id,
    displayName: dto.name ?? '',
    initials: null,
  };
}

export function mapCommentDtoToModel(
  dto: CommentDto | CommentCreateDto
): Comment {
  return {
    id: dto.id,
    createdAt: utcDate(dto.createdAt),
    createdByUserId: dto.createdByUserId ?? '',
    createdBy: dto.createdBy ?? '',
    content: dto.content,
    mentionedUsers: (dto.mentionedUsers ?? []).map(mapMentionUserDtoToModel),
    messageThreadId:
      (dto as { messageThreadId?: string }).messageThreadId ?? '',
  };
}

export const mapCommentsDtoToModels = (arr: CommentDto[]) =>
  arr.map(mapCommentDtoToModel);
