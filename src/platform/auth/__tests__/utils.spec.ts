import { describe, expect, it } from 'vitest';

import * as utils from '@/platform/auth/utils';
import { isInTeams, normalizeRedirectPath, parseScopes } from '@/platform/auth/utils';

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

  it('normalizeRedirectPath returns fallback for empty', () => {
    expect(normalizeRedirectPath(null, '/workspace')).toBe('/workspace');
    expect(normalizeRedirectPath('', '/workspace')).toBe('/workspace');
  });

  it('normalizeRedirectPath keeps internal paths and blocks /login loops', () => {
    expect(normalizeRedirectPath('/workspace/123', '/workspace')).toBe('/workspace/123');
    expect(normalizeRedirectPath('/login?redirect=%2Fworkspace', '/workspace')).toBe('/workspace');
  });

  it('normalizeRedirectPath strips same-origin absolute URLs', () => {
    // jsdom default origin is http://localhost
    expect(normalizeRedirectPath('http://localhost/workspace?x=1', '/workspace')).toBe('/workspace?x=1');
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


