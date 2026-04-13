import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFileMutations } from '@/domains/files/mutations';

import {
  buildChatHarness,
  createFakeChatService,
} from '@/test/chatProviderHarness';

describe('files mutations', () => {
  it('uploadFilesMutation sets progress and pushes uploaded', async () => {
    const uploadFiles = vi
      .fn()
      .mockImplementation(
        async (_files, _scope, onFileUploaded, onChunkUploaded) => {
          onChunkUploaded?.(1, 1, new File([new Uint8Array(1)], 'a.txt'));
          onFileUploaded?.(new File([new Uint8Array(1)], 'a.txt'), {
            id: 'id-a',
            name: 'a.txt',
          });
          return [{ id: 'id-a', name: 'a.txt' }];
        }
      );
    const service = createFakeChatService({ uploadFiles });
    const { wrapper } = buildChatHarness({ service });

    const { result } = renderHook(() => useFileMutations({ threadId: 't1' }), {
      wrapper,
    });
    await act(async () => {
      await result.current.uploadFilesMutation.mutateAsync([
        new File([new Uint8Array(1)], 'a.txt'),
      ]);
    });

    expect(result.current.fileProgress['a.txt']).toBe(100);
    expect(result.current.uploadedFiles[0].id).toBe('id-a');
  });

  it('downloadFileByUriMutation fetches and saves blob', async () => {
    const getFileDownloadUrl = vi
      .fn()
      .mockResolvedValueOnce('data:;base64,AA==');
    const service = createFakeChatService({ getFileDownloadUrl });
    const { wrapper } = buildChatHarness({ service });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      blob: async () => new Blob(['x']),
    } as any);
    if (!(URL as any).createObjectURL) {
      (URL as any).createObjectURL = vi.fn(() => 'blob://x');
    }
    if (!(URL as any).revokeObjectURL) {
      (URL as any).revokeObjectURL = vi.fn();
    }
    const createUrl = vi.spyOn(URL, 'createObjectURL');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL');

    const { result } = renderHook(() => useFileMutations({ threadId: 't1' }), {
      wrapper,
    });
    await result.current.downloadFileByUriMutation.mutateAsync({
      name: 'a.txt',
      sourceUri: '/x',
    });
    expect(getFileDownloadUrl).toHaveBeenCalledWith('/x');
    createUrl.mockRestore();
    revokeUrl.mockRestore();
  });
});
