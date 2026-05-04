import { ChatZod, SignalR } from '@smartspace/api-client';
import type { z } from 'zod';

import { utcDate } from '@/shared/utils/dateFromApi';

import { MessageThread, ThreadsResponse } from './model';

const {
  workSpacesThreadResponse: threadsListResponseSchema,
  messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsIdResponse:
    threadResponseSchema,
} = ChatZod;

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

/**
 * Map the SignalR `receiveThreadUpdate` payload to our thread model so we
 * can write it straight into the query cache without invalidating + refetching.
 */
export function mapSignalRThreadSummaryToModel(
  summary: SignalR.MessageThreadSummary
): MessageThread {
  return {
    id: summary.id,
    createdAt: utcDate(summary.createdAt),
    createdBy: summary.createdBy ?? '',
    createdByUserId: summary.createdByUserId,
    isFlowRunning: summary.isFlowRunning,
    lastUpdatedAt: utcDate(summary.lastUpdatedAt),
    lastUpdatedByUserId: summary.lastUpdatedByUserId,
    name: summary.name ?? '',
    totalMessages: summary.totalMessages,
    pinned: summary.favorited,
    workSpaceId: summary.workSpaceId,
  };
}
