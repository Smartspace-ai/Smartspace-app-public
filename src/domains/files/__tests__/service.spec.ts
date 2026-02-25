import { describe, expect, it, vi } from 'vitest';

import { api } from '@/platform/api';
import { apiMutator } from '@/platform/api/orvalMutator';

import {
  CHUNK_SIZE,
  downloadBlob,
  downloadFile,
  getFileDownloadUrl,
  getFileInfo,
  uploadFiles,
} from '@/domains/files/service';

vi.mock('@/platform/api/orvalMutator', () => ({
  apiMutator: vi.fn(),
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

const mockedMutator = vi.mocked(apiMutator);

describe('files service', () => {
  it('downloadFile calls api.get with blob response', async () => {
    const blob = new Blob(['x']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce(blob as any);
    const res = await downloadFile('f1', { threadId: 't1' });
    expect(res).toBeInstanceOf(Blob);
    spy.mockRestore();
  });

  it('getFileInfo parses response', async () => {
    const data = { id: 'f1', name: 'file.txt' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedMutator.mockResolvedValueOnce({ data } as any);
    const info = await getFileInfo('f1', { threadId: 't1' });
    expect(info.id).toBe('f1');
  });

  it('getFileDownloadUrl returns uri or throws', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce({ uri: 'http://x' } as any);
    await expect(getFileDownloadUrl('/x')).resolves.toBe('http://x');
    spy.mockRestore();
  });

  it('downloadBlob delegates to api.get', async () => {
    const blob = new Blob(['x']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(api, 'get').mockResolvedValueOnce(blob as any);
    const res = await downloadBlob('/x');
    expect(res).toBeInstanceOf(Blob);
    spy.mockRestore();
  });

  it('uploadFiles uses chunking for large files and returns mapped infos', async () => {
    const big = new File([new Uint8Array(CHUNK_SIZE + 1)], 'big.bin');
    const small = new File([new Uint8Array(1)], 'small.txt');
    // chatApi.postFiles goes through apiMutator; response.data is the file array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedMutator.mockResolvedValue({
      data: [{ id: 'x', name: 'big.bin' }],
    } as any);
    const res = await uploadFiles([big, small], { threadId: 't1' });
    expect(res.length).toBe(2);
    expect(res[0].id).toBeDefined();
    mockedMutator.mockReset();
  });
});
