import { getInitials } from '../utils/initials';

export class MentionUser {
  displayName!: string;
  id!: string;
  objectId?: string;
  initials?: string;
  display?: string;
  name?: string;

  constructor(params?: MentionUser) {
    Object.assign(this, params || {});

    if (!this.initials && this.name) {
      this.initials = getInitials(this.name);
    }

    if (!this.display) {
      this.display = this.name;
    }

    // react-mentions only works with id so we have to update the id to objectid
    this.id = this.id || '';
  }
}
