import { apiParsed } from '@/platform/apiParsed';

import {
  CommentDto,
  CommentPostResponseDto,
  CommentsListResponseDto,
  TCommentDto,
} from './dto';
import { mapCommentDtoToModel, mapCommentsDtoToModels } from './mapper';
import { Comment, MentionUser } from './model';

// Fetch all comments for a given thread
export async function fetchComments(threadId: string): Promise<Comment[]> {
  const dto = await apiParsed.get(
    CommentsListResponseDto,
    `/messageThreads/${threadId}/comments`
  );
  const models = mapCommentsDtoToModels(dto.data as TCommentDto[]);
  return models.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// Add a comment to a thread
export async function addComment(
  threadId: string,
  content: string,
  mentionedUsers: MentionUser[] = []
): Promise<Comment> {
  const dto = await apiParsed.post(
    CommentPostResponseDto,
    `/messageThreads/${threadId}/comments`,
    {
      content,
      mentionedUsers: mentionedUsers.map((u) => u.id),
    }
  );
  const normalizedDto: TCommentDto = {
    ...dto,
    messageThreadId: dto.messageThreadId ?? threadId,
    mentionedUsers: (dto.mentionedUsers ?? []).map((u) =>
      typeof u === 'string'
        ? { id: u, displayName: '' }
        : { ...u, displayName: u.displayName ?? '' }
    ),
  };
  const model = mapCommentDtoToModel(normalizedDto);
  return model;
}
