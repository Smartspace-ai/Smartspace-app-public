import { TCommentDto, TMentionUserDto } from './dto';
import { Comment, MentionUser } from './model';

export function mapMentionUserDtoToModel(dto: TMentionUserDto): MentionUser {
  return {
    id: dto.id,
    displayName: dto.displayName,
    initials: dto.initials ?? null,
  };
}

export function mapCommentDtoToModel(dto: TCommentDto): Comment {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    createdByUserId: dto.createdByUserId,
    createdBy: dto.createdBy,
    content: dto.content,
    mentionedUsers: (dto.mentionedUsers ?? []).map(mapMentionUserDtoToModel),
    messageThreadId: dto.messageThreadId,
  };
}

export const mapCommentsDtoToModels = (arr: TCommentDto[]) => arr.map(mapCommentDtoToModel);


