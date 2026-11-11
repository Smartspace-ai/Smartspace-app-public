import { describe, expect, it } from 'vitest';

import { queryClient } from '@/platform/reactQueryClient';

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
