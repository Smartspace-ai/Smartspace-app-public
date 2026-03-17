import { describe, expect, it } from 'vitest';

import * as messages from '@/domains/messages';

describe('messages index exports', () => {
  it('exposes expected APIs', () => {
    expect(messages.messagesKeys.all[0]).toBe('messages');
    expect(typeof messages.messagesListOptions).toBe('function');
    expect(typeof messages.fetchMessages).toBe('function');
  });
});
