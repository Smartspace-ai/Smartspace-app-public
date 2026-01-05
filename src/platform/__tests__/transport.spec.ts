
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuthAdapter } from '@/platform/auth';
import { parseScopes } from '@/platform/auth/utils';
import { transport } from '@/platform/transport';

vi.mock('@/platform/auth', () => ({
  createAuthAdapter: vi.fn(),
}));

vi.mock('@/platform/auth/utils', () => ({
  parseScopes: vi.fn((raw?: unknown) => String(raw ?? '').split(/[ ,]+/).filter(Boolean)),
}));

const runInterceptor = async (cfg: any) => {
  const h = (transport as any).interceptors.request.handlers?.[0]?.fulfilled as (c: any) => Promise<any>;
  if (!h) throw new Error('interceptor not found');
  return await h(cfg);
};

beforeEach(() => {
  vi.clearAllMocks();
  // default path
  Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true as any });
});

describe('transport request interceptor', () => {
  it('short-circuits on /login without auth header', async () => {
    (window as any).location.pathname = '/login';
    const cfg = await runInterceptor({ headers: {} });
    const headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBeFalsy();
    expect(createAuthAdapter).not.toHaveBeenCalled();
  });

  it('sets bearer on success, ignores errors', async () => {
    (parseScopes as unknown as jest.Mock | typeof parseScopes).mockReturnValue(['scope.a']);
    const getAccessToken = vi.fn().mockResolvedValueOnce('tok');
    (createAuthAdapter as any).mockReturnValue({ getAccessToken });
    let cfg = await runInterceptor({ headers: {} });
    let headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBe('Bearer tok');
    expect(getAccessToken).toHaveBeenCalledWith({ scopes: ['scope.a'], silentOnly: true });

    getAccessToken.mockRejectedValueOnce(new Error('x'));
    cfg = await runInterceptor({ headers: {} });
    headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBeFalsy();
  });

  it('filters config scopes and passes silentOnly', async () => {
    (parseScopes as any).mockReturnValue(['a', 'smartspaceapi.config.access', 'b']);
    const getAccessToken = vi.fn().mockResolvedValueOnce('msal');
    (createAuthAdapter as any).mockReturnValue({ getAccessToken });
    const cfg = await runInterceptor({ headers: {} });
    const headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBe('Bearer msal');
    expect(getAccessToken).toHaveBeenCalledWith({ scopes: ['a', 'b'], silentOnly: true });
  });
});


