import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { ssError } from '@/platform/log';
import { queryClient } from '@/platform/reactQueryClient';

describe('queryClient failed-query logging', () => {
  it('logs a failed query once, naming its query key, status, code and traceId', async () => {
    // Breaks if the QueryCache has no onError: the failure is silent.
    vi.mocked(ssError).mockClear();
    const failure = new AxiosError(
      'Request failed with status code 503',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 503,
        data: { code: 'unavailable', traceId: 'trace-1' },
      } as AxiosResponse
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ['test', 'failing-request'],
        queryFn: () => Promise.reject(failure),
        retry: false,
      })
    ).rejects.toBe(failure);

    expect(ssError).toHaveBeenCalledTimes(1);
    expect(ssError).toHaveBeenCalledWith('query', 'request failed', {
      queryKey: ['test', 'failing-request'],
      status: 503,
      code: 'unavailable',
      traceId: 'trace-1',
      message: 'Request failed with status code 503',
    });
  });

  it('never logs the bearer token the failed request carried', async () => {
    // Breaks if the raw error is logged: AxiosError's toJSON includes the
    // request config, so the token reaches the log Copy diagnostics copies.
    vi.mocked(ssError).mockClear();
    const failure = new AxiosError(
      'Request failed with status code 500',
      'ERR_BAD_RESPONSE',
      {
        headers: new AxiosHeaders({ Authorization: 'Bearer secret-token' }),
      } as InternalAxiosRequestConfig,
      undefined,
      { status: 500, data: {} } as AxiosResponse
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ['test', 'token-request'],
        queryFn: () => Promise.reject(failure),
        retry: false,
      })
    ).rejects.toBe(failure);

    expect(ssError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(ssError).mock.calls)).not.toContain(
      'secret-token'
    );
  });

  it('logs a response that fails validation with its zod issues', async () => {
    vi.mocked(ssError).mockClear();
    const issues = [{ path: ['data', 0, 'id'], message: 'Required' }];

    await expect(
      queryClient.fetchQuery({
        queryKey: ['test', 'invalid-response'],
        queryFn: () => Promise.reject({ type: 'ValidationError', issues }),
        retry: false,
      })
    ).rejects.toMatchObject({ type: 'ValidationError' });

    expect(ssError).toHaveBeenCalledWith(
      'query',
      'response failed validation',
      {
        queryKey: ['test', 'invalid-response'],
        issues,
      }
    );
  });
});

// What every generated client call throws when the API answers 503 retryable.
const retryableAxiosError = {
  isAxiosError: true,
  response: { status: 503, data: { code: 'SP503', retryable: true } },
};

describe('queryClient retry defaults', () => {
  it('retries a query when the API says a raw axios error is retryable', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    if (typeof retry !== 'function') throw new Error('retry is not a function');

    expect(retry(0, retryableAxiosError as unknown as Error)).toBe(true);
    expect(retry(2, retryableAxiosError as unknown as Error)).toBe(false);
  });

  it('never resends a mutation on a raw axios error', () => {
    const retry = queryClient.getDefaultOptions().mutations?.retry;
    if (typeof retry !== 'function') throw new Error('retry is not a function');

    expect(retry(0, retryableAxiosError as unknown as Error)).toBe(false);
  });
});
