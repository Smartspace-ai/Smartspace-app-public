import { getInitials } from '../utils/initials';
import { parseDateTime } from '../utils/parse-date-time';

export class MessageThread {
  id!: string;
  createdAt!: string | Date;
  createdBy!: string;
  createdByUserId!: string;
  isFlowRunning!: boolean;
  lastUpdated!: string;
  lastUpdatedAt!: string | Date;
  lastUpdatedByUserId!: string;
  name!: string;
  totalMessages!: number;
  favorited?: boolean;
  avatarName?: string;
  workSpaceId?: string;

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
}
