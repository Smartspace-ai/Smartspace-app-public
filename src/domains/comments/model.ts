export type MentionUser = {
  id: string;
  displayName: string;
  initials?: string | null;
};

export type Comment = {
  id: string;
  createdAt: Date | string;
  createdByUserId: string;
  createdBy: string;
  content: string;
  mentionedUsers: MentionUser[];
  messageThreadId: string;
};






