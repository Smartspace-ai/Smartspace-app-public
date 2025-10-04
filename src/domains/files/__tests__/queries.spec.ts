import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import * as files from '@/domains/files';
import { downloadFileBlobOptions } from '@/domains/files/queries';

describe('files queries options', () => {
  it('downloadFileBlobOptions composes key and calls service', async () => {
    const spy = vi.spyOn(files, 'downloadFile').mockResolvedValueOnce(new Blob(['x'], { type: 'text/plain' }));
    const scope = { threadId: 't1' };
    const opts = downloadFileBlobOptions('f1', scope);
    expect(opts.queryKey).toEqual(['files', 'query', 'downloadBlob', { fileId: 'f1' }]);
    await opts.queryFn?.({ client: new QueryClient(), queryKey: opts.queryKey as any, signal: new AbortController().signal, meta: undefined });
    expect(spy).toHaveBeenCalledWith('f1', scope);
    spy.mockRestore();
  });
});


