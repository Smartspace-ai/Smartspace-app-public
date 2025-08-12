import { getInitials } from '../utils/initials';

export class MentionUser {
  id!: string;
  displayName!: string;
  initials?: string;

  constructor(params?: MentionUser) {
    Object.assign(this, params || {});

    if (!this.initials) {
      this.initials = getInitials(this.displayName ?? '');
    }
  }
}
