import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { downloadFileBlobOptions } from '@/domains/files/queries';

import { createFakeChatService } from '@/test/chatProviderHarness';

describe('files queries options', () => {
  it('downloadFileBlobOptions composes key and calls service', async () => {
    const downloadFile = vi
      .fn()
      .mockResolvedValueOnce(new Blob(['x'], { type: 'text/plain' }));
    const service = createFakeChatService({ downloadFile });
    const scope = { threadId: 't1' };
    const opts = downloadFileBlobOptions(service, 'f1', scope);
    expect(opts.queryKey).toEqual([
      'files',
      'query',
      'downloadBlob',
      { fileId: 'f1' },
    ]);
    await opts.queryFn?.({
      client: new QueryClient(),
      queryKey: opts.queryKey as any,
      signal: new AbortController().signal,
      meta: undefined,
    });
    expect(downloadFile).toHaveBeenCalledWith('f1', scope);
  });
});
