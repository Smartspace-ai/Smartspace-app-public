import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useFileMutations } from '@/domains/files/mutations';
import * as service from '@/domains/files/service';

describe('files mutations', () => {
  it('uploadFilesMutation sets progress and pushes uploaded', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const spy = vi.spyOn(service, 'uploadFiles').mockImplementation(async (_files, _scope, onFileUploaded, onChunkUploaded) => {
      onChunkUploaded?.(1, 1, new File([new Uint8Array(1)], 'a.txt'));
      onFileUploaded?.(new File([new Uint8Array(1)], 'a.txt'), { id: 'id-a', name: 'a.txt' } as any);
      return [{ id: 'id-a', name: 'a.txt' } as any];
    });

    const { result } = renderHook(() => useFileMutations({ threadId: 't1' }), { wrapper });
    await act(async () => {
      await result.current.uploadFilesMutation.mutateAsync([new File([new Uint8Array(1)], 'a.txt')]);
    });

    expect(result.current.fileProgress['a.txt']).toBe(100);
    expect(result.current.uploadedFiles[0].id).toBe('id-a');
    spy.mockRestore();
  });

  it('downloadFileByUriMutation fetches and saves blob', async () => {
    const client = new QueryClient();
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    vi.spyOn(service, 'getFileDownloadUrl').mockResolvedValueOnce('data:;base64,AA==');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ blob: async () => new Blob(['x']) } as any);
    // jsdom may lack URL.createObjectURL; define if missing
    if (!(URL as any).createObjectURL) {
      (URL as any).createObjectURL = vi.fn(() => 'blob://x');
    }
    if (!(URL as any).revokeObjectURL) {
      (URL as any).revokeObjectURL = vi.fn();
    }
    const createUrl = vi.spyOn(URL, 'createObjectURL');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL');

    const { result } = renderHook(() => useFileMutations({ threadId: 't1' }), { wrapper });
    await result.current.downloadFileByUriMutation.mutateAsync({ name: 'a.txt', sourceUri: '/x' });
    expect(service.getFileDownloadUrl).toHaveBeenCalledWith('/x');
    createUrl.mockRestore();
    revokeUrl.mockRestore();
  });
});


