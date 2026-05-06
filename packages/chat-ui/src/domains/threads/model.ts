export type MessageThread = {
  id: string;
  createdAt: Date;
  createdBy: string;
  createdByUserId: string;
  isFlowRunning: boolean;
  lastUpdatedAt: Date;
  lastUpdatedByUserId: string;
  name: string;
  totalMessages: number;
  pinned: boolean;
  workSpaceId: string;
  /**
   * Monotonic version of when this summary was emitted (epoch ms). Used by
   * `applyThreadToCache` to reject stale writes — e.g. a SignalR summary
   * landing after a fresher SSE thread frame because the server's DB write
   * lagged Redis. Mappers derive this from `lastUpdatedAt`; client-side
   * writers like `ensureDraftThread` use `Date.now()`.
   */
  summaryEmittedAt: number;
};

export type ThreadsResponse = {
  data: MessageThread[];
  total: number;
};
