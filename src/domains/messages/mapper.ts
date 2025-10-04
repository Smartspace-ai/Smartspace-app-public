import { MessageListDto, TMessageDto, TMessageListDto } from './dto';
import { Message } from './model';

export function mapMessageDtoToModel(dto: TMessageDto): Message {
  return {
    id: dto.id ?? undefined,
    createdAt: dto.createdAt,
    createdBy: dto.createdBy ?? undefined,
    hasComments: dto.hasComments ?? false,
    createdByUserId: dto.createdByUserId ?? undefined,
    messageThreadId: dto.messageThreadId ?? undefined,
    errors: dto.errors ?? undefined,
    values: dto.values
      ? dto.values.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          value: v.value,
          channels: v.channels,
          createdAt: v.createdAt,
          createdBy: v.createdBy,
          createdByUserId: v.createdByUserId ?? undefined,
        }))
      : undefined,
  };
}

export function mapMessagesDtoToModels(dto: TMessageListDto): Message[] {
  const list = MessageListDto.parse(dto);
  return list.map(mapMessageDtoToModel);
}






