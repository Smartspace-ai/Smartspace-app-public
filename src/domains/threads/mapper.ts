import { MessageThreadDto, ThreadsResponseDto, TMessageThreadDto, TThreadsResponseDto } from './dto';
import { MessageThread, ThreadsResponse } from './model';


export function mapThreadDtoToModel(dto: TMessageThreadDto): MessageThread {
  const parsed = MessageThreadDto.parse(dto);
  return {
    ...parsed,
    createdAt: parsed.createdAt,
    lastUpdatedAt: parsed.lastUpdatedAt,
  };
}

export function mapThreadsResponseDtoToModel(dto: TThreadsResponseDto): ThreadsResponse {
  const env = ThreadsResponseDto.parse(dto);
  return { data: env.data.map(mapThreadDtoToModel), total: env.total };
}






