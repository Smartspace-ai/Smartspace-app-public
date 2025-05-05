import { getInitials } from '../utils/initials';
import { parseDateTime } from '../utils/parse-date-time';

export class MessageThread {
  id!: string;
  createdAt!: string | Date;
  createdBy!: string;
  createdByUserId!: string;
  lastUpdated!: string;
  lastUpdatedAt!: string | Date;
  lastUpdatedByUserId!: string;
  name!: string;
  totalMessages!: number;
  favorited?: boolean;
  avatarName?: string;
  newThread = false;

  constructor(params?: Partial<MessageThread>) {
    Object.assign(this, params || {});

    if (this.lastUpdatedAt) {
      this.lastUpdatedAt = parseDateTime(this.lastUpdatedAt);
    }
    if (this.name) {
      this.avatarName = getInitials(this.name);
    } else {
      this.avatarName = 'NA';
    }
  }

  static getDefaultEmpty(): MessageThread {
    return new MessageThread({
      id: 'new',
      createdAt: '',
      createdBy: '',
      createdByUserId: '',
      lastUpdated: '',
      lastUpdatedAt: '',
      lastUpdatedByUserId: '',
      name: 'new',
      totalMessages: 0,
      favorited: false,
    });
  }

  static getDefaultNewThread(): MessageThread {
    return new MessageThread({
      id: crypto.randomUUID(),
      createdAt: '',
      createdBy: '',
      createdByUserId: '',
      lastUpdated: '',
      lastUpdatedAt: '',
      lastUpdatedByUserId: '',
      name: 'new',
      totalMessages: 0,
      favorited: false,
      newThread: true,
    });
  }
}
