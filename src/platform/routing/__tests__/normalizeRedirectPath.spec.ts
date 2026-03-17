import { describe, expect, it } from 'vitest';

import { normalizeRedirectPath } from '../normalizeRedirectPath';

describe('normalizeRedirectPath', () => {
  const fallback = '/workspace';

  it('returns fallback for empty string', () => {
    expect(normalizeRedirectPath('')).toBe(fallback);
  });

  it('returns fallback for null', () => {
    expect(normalizeRedirectPath(null)).toBe(fallback);
  });

  it('returns fallback for undefined', () => {
    expect(normalizeRedirectPath(undefined)).toBe(fallback);
  });

  it('returns fallback for whitespace-only string', () => {
    expect(normalizeRedirectPath('   ')).toBe(fallback);
  });

  it('passes through internal path', () => {
    expect(normalizeRedirectPath('/workspace/123')).toBe('/workspace/123');
  });

  it('preserves query string and hash', () => {
    expect(normalizeRedirectPath('/workspace/123?tab=1#section')).toBe(
      '/workspace/123?tab=1#section'
    );
  });

  it('returns fallback for /login (prevents loop)', () => {
    expect(normalizeRedirectPath('/login')).toBe(fallback);
  });

  it('returns fallback for /login subpath', () => {
    expect(normalizeRedirectPath('/login/callback')).toBe(fallback);
  });

  it('returns fallback for external URL (open redirect prevention)', () => {
    expect(normalizeRedirectPath('https://evil.com')).toBe(fallback);
  });

  it('returns fallback for protocol-relative URL', () => {
    expect(normalizeRedirectPath('//evil.com')).toBe(fallback);
  });

  it('returns fallback for javascript: protocol', () => {
    expect(normalizeRedirectPath('javascript:alert(1)')).toBe(fallback);
  });

  it('strips same-origin absolute URL to path', () => {
    const origin = window.location.origin;
    expect(normalizeRedirectPath(`${origin}/workspace/456`)).toBe(
      '/workspace/456'
    );
  });

  it('uses custom fallback when provided', () => {
    expect(normalizeRedirectPath('', '/custom')).toBe('/custom');
  });

  it('returns fallback for same-origin /login URL', () => {
    const origin = window.location.origin;
    expect(normalizeRedirectPath(`${origin}/login`)).toBe(fallback);
  });
});
