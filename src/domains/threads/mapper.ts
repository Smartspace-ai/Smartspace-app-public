import type { z } from 'zod';

import {
  getWorkSpacesIdMessageThreadsResponse as threadsListResponseSchema,
  getWorkspacesWorkspaceIdMessagethreadsIdResponse as threadResponseSchema,
} from '@/platform/api/generated/chat/zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { MessageThread, ThreadsResponse } from './model';

type ThreadsResponseDto = z.infer<typeof threadsListResponseSchema>;
type ThreadDto = z.infer<typeof threadResponseSchema>;

export function mapThreadDtoToModel(dto: ThreadDto): MessageThread {
  return {
    id: dto.id,
    createdAt: utcDate(dto.createdAt),
    createdBy: dto.createdBy ?? '',
    createdByUserId: dto.createdByUserId,
    isFlowRunning: dto.isFlowRunning,
    lastUpdatedAt: utcDate(dto.lastUpdatedAt),
    lastUpdatedByUserId: dto.lastUpdatedByUserId,
    name: dto.name ?? '',
    totalMessages: dto.totalMessages,
    pinned: dto.favorited,
    workSpaceId: dto.workSpaceId,
  };
}

export function mapThreadsResponseDtoToModel(
  dto: ThreadsResponseDto
): ThreadsResponse {
  return { data: dto.data.map(mapThreadDtoToModel), total: dto.total };
}
