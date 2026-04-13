import { describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line import/order -- plugin flip-flops between "missing"/"extra" blank for single-external + path-grouped internal
import { api } from '@/platform/api';

const { mockGetMessages, mockMessageElementParse } = vi.hoisted(() => ({
  mockGetMessages: vi.fn(),
  mockMessageElementParse: vi.fn((data: unknown) => data),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      messageThreadsThreadMessagesIdMessages: mockGetMessages,
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

vi.mock('@/platform/log', () => ({
  ssDebug: vi.fn(),
  ssWarn: vi.fn(),
  ssError: vi.fn(),
}));

import { createDefaultChatService } from '@/platform/chat/defaultChatService';

type ProgressEventLike = { event: { currentTarget: { response: string } } };

describe('defaultChatService', () => {
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
    const obs = service.sendMessage({ workSpaceId: 'w', threadId: 't1' });

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

  it('sendMessage observable emits error when stream fails', () => {
    const networkError = new Error('Network failure');
    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce(networkError);

    const service = createDefaultChatService();
    const obs = service.sendMessage({ workSpaceId: 'w', threadId: 't1' });

    return new Promise<void>((resolve) => {
      obs.subscribe({
        error: (err) => {
          expect(err).toBe(networkError);
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
