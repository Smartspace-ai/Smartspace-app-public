import { describe, expect, it, vi } from 'vitest';

import { ssError } from '@/platform/log';
import { queryClient } from '@/platform/reactQueryClient';

describe('queryClient failed-query logging', () => {
  it('logs a failed query once, naming its query key', async () => {
    // Breaks if the QueryCache has no onError: the failure is silent.
    vi.mocked(ssError).mockClear();
    const failure = new Error('Request failed with status 500');

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
      error: failure,
    });
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
