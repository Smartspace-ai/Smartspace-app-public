import { apiParsed } from '@/platform/apiParsed';

import { CommentDto, CommentsListResponseDto, TCommentDto } from './dto';
import { mapCommentDtoToModel, mapCommentsDtoToModels } from './mapper';
import { Comment, MentionUser } from './model';

// Fetch all comments for a given thread
export async function fetchComments(threadId: string): Promise<Comment[]> {
  const dto = await apiParsed.get(CommentsListResponseDto, `/messageThreads/${threadId}/comments`);
  const models = mapCommentsDtoToModels(dto.data as TCommentDto[]);
  return models.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Add a comment to a thread
export async function addComment(
  threadId: string,
  content: string,
  mentionedUsers: MentionUser[] = []
): Promise<Comment> {
  const dto = await apiParsed.post(CommentDto, `/messageThreads/${threadId}/comments`, {
    content,
    mentionedUsers: mentionedUsers.map((u) => u.id),
  });
  const model = mapCommentDtoToModel({
    ...dto,
    messageThreadId: threadId,
    mentionedUsers: (dto.mentionedUsers ?? []).map(u => ({ ...u, displayName: u.displayName ?? '' }))
  } as TCommentDto);
  return model;
}



