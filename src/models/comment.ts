import { MentionUser } from './mention-user';

export class Comment {
  id!: string;
  createdAt!: Date | string;
  createdByUserId!: string;
  createdBy!: string;
  content!: string;
  mentionedUsers: MentionUser[] = [];
  messageThreadId!: string;

  constructor(params?: Comment) {
    Object.assign(this, params || {});
  }
}
