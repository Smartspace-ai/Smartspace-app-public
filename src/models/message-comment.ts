import { MentionUser } from './mention-user';

export class MessageComment {
  id!: string;
  createdAt!: Date | string;
  createdByUserId!: string;
  createdBy!: string;
  content!: string;
  mentionedUsers: MentionUser[] = [];
  messageThreadId!: string;

  constructor(params?: MessageComment) {
    Object.assign(this, params || {});
  }
}
