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
  favorited: boolean;
  workSpaceId: string;
};

export type ThreadsResponse = {
  data: MessageThread[];
  total: number;
};
