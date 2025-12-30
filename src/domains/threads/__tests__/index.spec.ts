import { describe, expect, it } from 'vitest';

import * as threads from '@/domains/threads';

describe('threads index exports', () => {
  it('exposes expected APIs', () => {
    expect(threads.threadsKeys.all[0]).toBe('threads');
    expect(typeof threads.threadsListOptions).toBe('function');
    expect(typeof threads.fetchThreads).toBe('function');
  });
});
