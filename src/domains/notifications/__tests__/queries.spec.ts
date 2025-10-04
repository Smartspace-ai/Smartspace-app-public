import { describe, expect, it } from 'vitest';

import * as notifications from '@/domains/notifications';

describe('notifications query', () => {
  it('builds key with unreadOnly', () => {
    const isUnreadOnly = true;
    expect(notifications.notificationsKeys.infinite({ unreadOnly: isUnreadOnly })).toEqual(['notifications', 'infinite', { unreadOnly: true }]);
  });
});


