
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { msalInstance } from '@/platform/auth/msalClient';
import { acquireNaaToken } from '@/platform/auth/naaClient';
import { isInTeams, parseScopes } from '@/platform/auth/utils';
import { transport } from '@/platform/transport';

vi.mock('@/platform/auth/msalClient', () => ({
  msalInstance: {
    acquireTokenSilent: vi.fn(),
    loginRedirect: vi.fn(),
    getActiveAccount: vi.fn(() => null),
    getAllAccounts: vi.fn(() => []),
  },
}));

vi.mock('@azure/msal-browser', async () => {
  class InteractionRequiredAuthError extends Error {}
  return { InteractionRequiredAuthError };
});

vi.mock('@/platform/auth/msalConfig', () => ({
  interactiveLoginRequest: { scopes: ['s'] },
}));

vi.mock('@/platform/auth/naaClient', () => ({
  acquireNaaToken: vi.fn(),
}));

vi.mock('@/platform/auth/utils', () => ({
  isInTeams: vi.fn(() => false),
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
  });

  it('teams branch sets bearer on success, ignores errors', async () => {
    (isInTeams as unknown as jest.Mock | typeof isInTeams).mockReturnValue(true);
    (parseScopes as unknown as jest.Mock | typeof parseScopes).mockReturnValue(['scope.a']);
    (acquireNaaToken as unknown as jest.Mock | typeof acquireNaaToken).mockResolvedValueOnce('naa');
    let cfg = await runInterceptor({ headers: {} });
    let headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBe('Bearer naa');

    (acquireNaaToken as any).mockRejectedValueOnce(new Error('x'));
    cfg = await runInterceptor({ headers: {} });
    headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBeFalsy();
  });

  it('msal branch sets bearer and filters config scopes', async () => {
    (isInTeams as any).mockReturnValue(false);
    (parseScopes as any).mockReturnValue(['a', 'smartspaceapi.config.access', 'b']);
    (msalInstance.acquireTokenSilent as any).mockResolvedValueOnce({ accessToken: 'msal' });
    const cfg = await runInterceptor({ headers: {} });
    const headers = cfg.headers instanceof AxiosHeaders ? cfg.headers : new AxiosHeaders(cfg.headers);
    expect(headers.get('Authorization')).toBe('Bearer msal');
    expect(msalInstance.acquireTokenSilent).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['a', 'b'] }));
  });

  it('msal branch triggers loginRedirect on InteractionRequiredAuthError', async () => {
    (isInTeams as any).mockReturnValue(false);
    (parseScopes as any).mockReturnValue(['a']);
    (msalInstance.acquireTokenSilent as any).mockRejectedValueOnce(new InteractionRequiredAuthError('need', 'login'));
    await runInterceptor({ headers: {} });
    expect(msalInstance.loginRedirect).toHaveBeenCalled();
  });
});


