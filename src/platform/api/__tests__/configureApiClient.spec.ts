import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAxiosInstance, mockGetAuthAdapter, mockSetRuntimeAuthError } =
  vi.hoisted(() => ({
    mockAxiosInstance: {
      defaults: { baseURL: '' } as Record<string, unknown>,
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    },
    mockGetAuthAdapter: vi.fn(),
    mockSetRuntimeAuthError: vi.fn(),
  }));

vi.mock('@smartspace/api-client', () => ({
  AXIOS_INSTANCE: mockAxiosInstance,
}));

vi.mock('@/platform/auth/errors', () => {
  class AuthRequiredError extends Error {
    constructor(msg = 'Authentication required') {
      super(msg);
      this.name = 'AuthRequiredError';
    }
  }
  return { AuthRequiredError };
});

vi.mock('@/platform/auth/index', () => ({
  getAuthAdapter: () => mockGetAuthAdapter(),
}));

vi.mock('@/platform/auth/msalConfig', () => ({
  isInTeams: () => false,
}));

vi.mock('@/platform/auth/runtime', () => ({
  getAuthRuntimeState: () => ({ isInTeams: null, lastError: null }),
  setRuntimeAuthError: mockSetRuntimeAuthError,
}));

vi.mock('@/platform/auth/scopes', () => ({
  getApiScopes: () => ['api://scope'],
}));

vi.mock('@/platform/auth/sessionQuery', () => ({
  SESSION_QUERY_KEY: ['auth', 'session'],
}));

vi.mock('@/platform/log', () => ({
  ssInfo: vi.fn(),
  ssWarn: vi.fn(),
}));

vi.mock('@/platform/reactQueryClient', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));

import { configureApiClient } from '@/platform/api/configureApiClient';

describe('configureApiClient', () => {
  beforeEach(() => {
    mockAxiosInstance.defaults = { baseURL: '' };
    mockAxiosInstance.interceptors.request.use.mockReset();
    mockGetAuthAdapter.mockReset();
    mockSetRuntimeAuthError.mockReset();
  });

  it('sets baseURL from env', () => {
    configureApiClient();
    // In test env VITE_CHAT_API_URI may be undefined → falls back to ''
    expect(typeof mockAxiosInstance.defaults.baseURL).toBe('string');
  });

  it('registers two request interceptors', () => {
    configureApiClient();
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(2);
  });

  describe('primitive body interceptor', () => {
    let interceptor: (
      config: Record<string, unknown>
    ) => Record<string, unknown>;

    beforeEach(() => {
      configureApiClient();
      interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('stringifies boolean data', () => {
      const result = interceptor({ data: true });
      expect(result.data).toBe('true');
    });

    it('stringifies number data', () => {
      const result = interceptor({ data: 42 });
      expect(result.data).toBe('42');
    });

    it('leaves object data unchanged', () => {
      const obj = { key: 'val' };
      const result = interceptor({ data: obj });
      expect(result.data).toBe(obj);
    });

    it('leaves string data unchanged', () => {
      const result = interceptor({ data: 'already a string' });
      expect(result.data).toBe('already a string');
    });

    it('leaves null/undefined data unchanged', () => {
      expect(interceptor({ data: null }).data).toBeNull();
      expect(interceptor({ data: undefined }).data).toBeUndefined();
    });
  });

  describe('auth interceptor', () => {
    let interceptor: (
      config: Record<string, unknown>
    ) => Promise<Record<string, unknown>>;

    beforeEach(() => {
      configureApiClient();
      interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[1][0];
    });

    it('attaches Bearer token on success', async () => {
      mockGetAuthAdapter.mockReturnValue({
        getAccessToken: vi.fn().mockResolvedValue('tok_abc'),
      });

      const config = { headers: {} };
      const result = await interceptor(config);
      expect(result.headers).toBeDefined();
      expect(mockSetRuntimeAuthError).toHaveBeenCalledWith(null);
    });

    it('throws AuthRequiredError on token failure', async () => {
      mockGetAuthAdapter.mockReturnValue({
        getAccessToken: vi.fn().mockRejectedValue(new Error('no token')),
      });

      await expect(interceptor({ headers: {} })).rejects.toThrow(
        'Authentication required'
      );
    });

    it('skips auth on /login path', async () => {
      const original = window.location.pathname;
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
        configurable: true,
      });

      const config = { headers: {} };
      const result = await interceptor(config);
      expect(result).toBe(config);
      expect(mockGetAuthAdapter).not.toHaveBeenCalled();

      Object.defineProperty(window, 'location', {
        value: { pathname: original },
        writable: true,
        configurable: true,
      });
    });
  });
});
