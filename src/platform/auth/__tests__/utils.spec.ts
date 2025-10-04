import { describe, expect, it } from 'vitest';

import * as utils from '@/platform/auth/utils';

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


