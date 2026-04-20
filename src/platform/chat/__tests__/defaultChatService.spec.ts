import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line import/order -- plugin flip-flops between "missing"/"extra" blank for single-external + path-grouped internal
import { api } from '@/platform/api';

const {
  mockGetMessages,
  mockMessageElementParse,
  mockUploadFiles,
  mockGetFileInfo,
  mockGetThread,
  mockGetWorkspace,
  mockGetWorkspaceUsers,
} = vi.hoisted(() => ({
  mockGetMessages: vi.fn(),
  mockMessageElementParse: vi.fn((data: unknown) => data),
  mockUploadFiles: vi.fn(),
  mockGetFileInfo: vi.fn(),
  mockGetThread: vi.fn(),
  mockGetWorkspace: vi.fn(),
  mockGetWorkspaceUsers: vi.fn(),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      messageThreadsThreadMessagesIdMessages: mockGetMessages,
      filesUploadFiles: mockUploadFiles,
      filesGetFileInfo: mockGetFileInfo,
      messageThreadsGetMessageThreadWorkspacesWorkspaceIdMessagethreadsId:
        mockGetThread,
      workSpacesGetId: mockGetWorkspace,
      workSpacesGetUsers: mockGetWorkspaceUsers,
    }),
  },
  ChatZod: {
    messageThreadsThreadMessagesIdMessagesResponse: {
      shape: {
        data: {
          element: {
            parse: mockMessageElementParse,
          },
        },
      },
    },
    getFilesIdResponse: {},
    postFilesResponse: {},
    getWorkspacesWorkspaceIdMessagethreadsIdResponse: {},
    getWorkSpacesIdResponse: {},
    getWorkSpacesIdUsersResponse: {},
  },
  AXIOS_INSTANCE: {},
}));

vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

const { mockSsError } = vi.hoisted(() => ({
  mockSsError: vi.fn(),
}));

vi.mock('@/platform/log', () => ({
  ssDebug: vi.fn(),
  ssWarn: vi.fn(),
  ssError: mockSsError,
}));

import { createDefaultChatService } from '@/platform/chat/defaultChatService';

type ProgressEventLike = { event: { currentTarget: { response: string } } };

describe('defaultChatService', () => {
  beforeEach(() => {
    mockGetMessages.mockReset();
    mockUploadFiles.mockReset();
    mockGetFileInfo.mockReset();
    mockGetThread.mockReset();
    mockGetWorkspace.mockReset();
    mockGetWorkspaceUsers.mockReset();
    mockSsError.mockReset();
  });

  it('fetchMessages returns mapped list', async () => {
    const envelope = {
      data: [
        {
          id: 'm1',
          createdAt: '2024-01-01',
          createdBy: 'u1',
          hasComments: true,
          createdByUserId: 'u1',
          messageThreadId: 't1',
          values: [],
        },
      ],
    };
    mockGetMessages.mockResolvedValueOnce({ data: envelope });
    const service = createDefaultChatService();
    const res = await service.fetchMessages('t1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('m1');
  });

  it('sendMessage sets up SSE handling (smoke)', async () => {
    let capturedCb: ((e: ProgressEventLike) => void) | undefined;
    const postSpy = vi.spyOn(api, 'post').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_url: string, _payload: any, cfg?: any) => {
        capturedCb = cfg?.onDownloadProgress as
          | ((e: ProgressEventLike) => void)
          | undefined;
        return undefined as unknown as never;
      }
    );

    const service = createDefaultChatService();
    const obs = service.sendMessage({ workspaceId: 'w', threadId: 't1' });

    const chunk = JSON.stringify({
      id: 'm2',
      createdAt: '2024-01-01',
      createdBy: 'u1',
      hasComments: false,
      createdByUserId: 'u1',
      messageThreadId: 't1',
      values: [],
    });
    capturedCb?.({
      event: { currentTarget: { response: `data:${chunk}\n\n` } },
    });
    capturedCb?.({
      event: {
        currentTarget: { response: `data:${chunk}\n\ndata:${chunk}\n\n` },
      },
    });

    expect(typeof obs.subscribe).toBe('function');
    postSpy.mockRestore();
  });

  it('sendMessage observable emits a scrubbed error when stream fails', () => {
    const networkError = new Error('Network failure');
    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce(networkError);

    const service = createDefaultChatService();
    const obs = service.sendMessage({ workspaceId: 'w', threadId: 't1' });

    return new Promise<void>((resolve) => {
      obs.subscribe({
        error: (err) => {
          // Subscribers must receive a plain Error with only the message —
          // the original axios error (which may contain auth headers) must
          // not leak through.
          expect(err).toBeInstanceOf(Error);
          expect(err).not.toBe(networkError);
          expect((err as Error).message).toBe('Network failure');
          postSpy.mockRestore();
          resolve();
        },
      });
    });
  });

  it('addInputToMessage throws when no valid message received', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce(undefined as never);

    const service = createDefaultChatService();
    await expect(
      service.addInputToMessage({
        messageId: 'm1',
        name: 'test',
        value: 'v',
        channels: null,
      })
    ).rejects.toThrow('No valid message received from stream');
  });

  it('sendMessage scrubs auth headers from logged errors', () => {
    mockSsError.mockClear();
    const axiosLikeError = Object.assign(new Error('Boom'), {
      config: { headers: { Authorization: 'Bearer SECRET-TOKEN' } },
      request: { _header: 'Authorization: Bearer SECRET-TOKEN' },
      response: {
        status: 500,
        statusText: 'oops',
        config: { headers: { Authorization: 'Bearer SECRET-TOKEN' } },
      },
    });
    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce(axiosLikeError);

    const service = createDefaultChatService();
    const obs = service.sendMessage({ workspaceId: 'w', threadId: 't1' });

    return new Promise<void>((resolve) => {
      obs.subscribe({
        error: () => {
          expect(mockSsError).toHaveBeenCalledTimes(1);
          const logged = JSON.stringify(mockSsError.mock.calls[0]);
          expect(logged).not.toContain('SECRET-TOKEN');
          expect(logged).not.toContain('Authorization');
          postSpy.mockRestore();
          resolve();
        },
      });
    });
  });

  it('uploadFiles posts a small file and maps the response', async () => {
    mockUploadFiles.mockResolvedValueOnce({
      data: [{ id: 'f1', name: 'a.txt' }],
    });
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    const onFileUploaded = vi.fn();

    const service = createDefaultChatService();
    const result = await service.uploadFiles(
      [file],
      { workspaceId: 'w', threadId: 't' },
      onFileUploaded
    );

    expect(result).toEqual([{ id: 'f1', name: 'a.txt' }]);
    expect(mockUploadFiles).toHaveBeenCalledTimes(1);
    expect(mockUploadFiles.mock.calls[0][0].workspaceId).toBe('w');
    expect(onFileUploaded).toHaveBeenCalledWith(file, {
      id: 'f1',
      name: 'a.txt',
    });
  });

  it('uploadFiles chunks files larger than CHUNK_SIZE and fires progress callbacks', async () => {
    const file = new File(['x'], 'big.bin');
    Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 });
    // 50MB at 20MB chunks => 3 chunks; only the last response carries data
    mockUploadFiles
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 'big-f', name: 'big.bin' }] });
    const onChunkUploaded = vi.fn();

    const service = createDefaultChatService();
    const result = await service.uploadFiles(
      [file],
      { workspaceId: 'w', threadId: 't' },
      undefined,
      onChunkUploaded
    );

    expect(mockUploadFiles).toHaveBeenCalledTimes(3);
    expect(onChunkUploaded).toHaveBeenCalledTimes(3);
    expect(onChunkUploaded.mock.calls[0]).toEqual([1, 3, file]);
    expect(onChunkUploaded.mock.calls[2]).toEqual([3, 3, file]);
    expect(result).toEqual([{ id: 'big-f', name: 'big.bin' }]);
    // every chunk reuses the same uploadId
    const ids = mockUploadFiles.mock.calls.map((c) => c[0].uploadId);
    expect(new Set(ids).size).toBe(1);
    // chunkIndex must be 0-indexed and increment monotonically; lastChunk
    // must be set only on the final chunk so the backend knows when to
    // assemble. Regressions here silently corrupt large uploads.
    expect(mockUploadFiles.mock.calls[0][0]).toMatchObject({
      chunkIndex: 0,
      totalChunks: 3,
      lastChunk: false,
    });
    expect(mockUploadFiles.mock.calls[1][0]).toMatchObject({
      chunkIndex: 1,
      totalChunks: 3,
      lastChunk: false,
    });
    expect(mockUploadFiles.mock.calls[2][0]).toMatchObject({
      chunkIndex: 2,
      totalChunks: 3,
      lastChunk: true,
    });
  });

  it('downloadFile delegates to api.get with blob responseType and scope params', async () => {
    const blob = new Blob(['data']);
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(blob as never);

    const service = createDefaultChatService();
    const result = await service.downloadFile('file-1', {
      workspaceId: 'w',
      threadId: 't',
    });

    expect(result).toBe(blob);
    expect(getSpy).toHaveBeenCalledWith('/files/file-1/download', {
      responseType: 'blob',
      params: { workspaceId: 'w', threadId: 't' },
    });
    getSpy.mockRestore();
  });

  it('getFileInfo maps the API response', async () => {
    mockGetFileInfo.mockResolvedValueOnce({
      data: { id: 'f9', name: 'doc.pdf' },
    });

    const service = createDefaultChatService();
    const result = await service.getFileInfo('f9', {
      workspaceId: 'w',
      threadId: 't',
    });

    expect(result).toEqual({ id: 'f9', name: 'doc.pdf' });
    expect(mockGetFileInfo).toHaveBeenCalledWith('f9', {
      workspaceId: 'w',
      threadId: 't',
    });
  });

  it('getFileDownloadUrl returns the uri from the response', async () => {
    const getSpy = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce({ uri: 'https://blob/file' } as never);

    const service = createDefaultChatService();
    const result = await service.getFileDownloadUrl('/files/abc/download-uri');

    expect(result).toBe('https://blob/file');
    getSpy.mockRestore();
  });

  it('getFileDownloadUrl throws when the response is missing uri', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({} as never);

    const service = createDefaultChatService();
    await expect(
      service.getFileDownloadUrl('/files/abc/download-uri')
    ).rejects.toThrow('Download URL is missing');
    getSpy.mockRestore();
  });

  it('fetchThread maps the API response', async () => {
    const dto = {
      id: 't1',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'u1',
      createdByUserId: 'u1',
      isFlowRunning: false,
      lastUpdatedAt: '2024-01-01T00:00:00Z',
      lastUpdatedByUserId: 'u1',
      name: 'Hello',
      totalMessages: 1,
      favorited: false,
      workSpaceId: 'w',
    };
    mockGetThread.mockResolvedValueOnce({ data: dto });

    const service = createDefaultChatService();
    const result = await service.fetchThread('w', 't1');

    expect(result.id).toBe('t1');
    expect(result.name).toBe('Hello');
    expect(result.workSpaceId).toBe('w');
    expect(mockGetThread).toHaveBeenCalledWith('w', 't1');
  });

  it('fetchWorkspace maps the API response', async () => {
    const dto = { id: 'w', name: 'Demo', tags: [] };
    mockGetWorkspace.mockResolvedValueOnce({ data: dto });

    const service = createDefaultChatService();
    const result = await service.fetchWorkspace('w');

    expect(result.id).toBe('w');
    expect(result.name).toBe('Demo');
    expect(mockGetWorkspace).toHaveBeenCalledWith('w');
  });

  it('fetchTaggableUsers maps each user in the response', async () => {
    mockGetWorkspaceUsers.mockResolvedValueOnce({
      data: [
        { id: 'u1', displayName: 'Alice Anderson' },
        { id: 'u2', displayName: 'Bob Brown' },
      ],
    });

    const service = createDefaultChatService();
    const result = await service.fetchTaggableUsers('w');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('u1');
    expect(result[0].initials).toBe('AA');
    expect(result[1].initials).toBe('BB');
  });

  it('addInputToMessage returns parsed message from SSE stream', async () => {
    const chunk = JSON.stringify({
      id: 'm3',
      createdAt: '2024-01-01',
      createdBy: 'u1',
      hasComments: false,
      createdByUserId: 'u1',
      messageThreadId: 't1',
      values: [],
    });

    vi.spyOn(api, 'post').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (_url: string, _payload: any, cfg?: any) => {
        const cb = cfg?.onDownloadProgress as
          | ((e: ProgressEventLike) => void)
          | undefined;
        cb?.({
          event: { currentTarget: { response: `data:${chunk}\n\n` } },
        });
        return undefined as unknown as never;
      }
    );

    const service = createDefaultChatService();
    const result = await service.addInputToMessage({
      messageId: 'm1',
      name: 'test',
      value: 'v',
      channels: null,
    });
    expect(result.id).toBe('m3');
  });
});
