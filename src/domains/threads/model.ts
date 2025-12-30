export type MessageThread = {
  id: string;
  createdAt: Date | string;
  createdBy: string;
  createdByUserId: string;
  isFlowRunning: boolean;
  lastUpdated: string;
  lastUpdatedAt: Date | string;
  lastUpdatedByUserId: string;
  name: string;
  totalMessages: number;
  favorited?: boolean | null;
  avatarName?: string | null;
  workSpaceId?: string | null;
};

export type ThreadsResponse = {
  data: MessageThread[];
  total: number;
};






