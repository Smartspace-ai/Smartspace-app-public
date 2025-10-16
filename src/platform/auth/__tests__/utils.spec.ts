import { describe, expect, it } from 'vitest';

import * as utils from '@/platform/auth/utils';
import { isInTeams, parseScopes } from '@/platform/auth/utils';

describe('auth utils', () => {
  it('parseScopes splits by comma/space and trims', () => {
    expect(parseScopes('a, b c')).toEqual(['a', 'b', 'c']);
    expect(parseScopes(undefined)).toEqual([]);
  });

  it.skip('isInTeams returns true when embedded (parent !== window)', () => {
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', { value: {} });
    expect(isInTeams()).toBe(true);
    Object.defineProperty(window, 'parent', { value: originalParent });
  });

  it('isInTeams returns false when not embedded and no query flag', () => {
    expect(isInTeams()).toBe(false);
  });
});

describe('parseScopes', () => {
  it('splits by comma and space and trims', () => {
    expect(utils.parseScopes('a, b c')).toEqual(['a', 'b', 'c']);
  });
  it('handles empty/undefined', () => {
    expect(utils.parseScopes(undefined)).toEqual([]);
  });
});

describe('isInTeams', () => {
  it('false by default in tests (mocked in setup)', () => {
    expect(utils.isInTeams()).toBe(false);
  });
});


