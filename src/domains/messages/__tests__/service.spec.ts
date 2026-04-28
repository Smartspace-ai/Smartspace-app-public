import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMessages,
  mockPostMessage,
  mockMessageElementParse,
  mockGetAccessToken,
} = vi.hoisted(() => ({
  mockGetMessages: vi.fn(),
  mockPostMessage: vi.fn(),
  mockMessageElementParse: vi.fn((data: unknown) => data),
  mockGetAccessToken: vi.fn(async () => 'test-token'),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      messageThreadsThreadMessagesIdMessages: mockGetMessages,
      messagesThreadMessages: mockPostMessage,
    }),
  },
  ChatZod: {
    messageThreadsThreadMessagesIdMessagesResponse: {
      shape: {
        data: {
          element: {
            parse: mockMessageElementParse,
            shape: {
              values: { element: { parse: vi.fn((d: unknown) => d) } },
              errors: { element: { parse: vi.fn((d: unknown) => d) } },
            },
          },
        },
      },
    },
  },
  AXIOS_INSTANCE: { defaults: { baseURL: 'https://api.test' } },
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

vi.mock('@/platform/log', () => ({
  ssDebug: vi.fn(),
  ssInfo: vi.fn(),
  ssWarn: vi.fn(),
  ssError: vi.fn(),
}));

vi.mock('@/platform/auth', () => ({
  getAuthAdapter: () => ({ getAccessToken: mockGetAccessToken }),
}));

vi.mock('@/platform/auth/scopes', () => ({
  getApiScopes: () => ['scope.read'],
}));

import {
  addInputToMessage,
  fetchMessages,
  postMessage,
} from '@/domains/messages';

function bodyFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe('messages service', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
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
    const res = await fetchMessages('t1');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('m1');
  });

  it('postMessage POSTs JSON and returns the parsed Message body', async () => {
    const real = {
      id: 'real-7',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'Server',
      createdByUserId: 'u1',
      hasComments: false,
      messageThreadId: 't1',
      errors: [],
      values: [],
    };
    mockPostMessage.mockResolvedValueOnce({ data: real });

    const result = await postMessage({
      workSpaceId: 'w',
      threadId: 't1',
      contentList: [{ type: 'text', text: 'hi' } as never],
    });

    expect(result.id).toBe('real-7');

    expect(mockPostMessage).toHaveBeenCalledOnce();
    const [body] = mockPostMessage.mock.calls[0];
    expect(body.messageThreadId).toBe('t1');
    expect(body.workSpaceId).toBe('w');
    expect(body.inputs[0].name).toBe('prompt');
  });

  it('postMessage propagates errors from the request', async () => {
    mockPostMessage.mockRejectedValueOnce(new Error('boom'));
    await expect(
      postMessage({ workSpaceId: 'w', threadId: 't1' })
    ).rejects.toThrow('boom');
  });

  it('addInputToMessage throws when no valid message received', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(bodyFromChunks([]), { status: 200 })
    ) as typeof fetch;

    await expect(
      addInputToMessage({
        messageId: 'm1',
        name: 'test',
        value: 'v',
        channels: null,
      })
    ).rejects.toThrow('No valid message received from stream');
  });

  it('addInputToMessage returns the last successfully parsed Message', async () => {
    const chunkA = JSON.stringify({
      id: 'm3',
      createdAt: '2024-01-01',
      createdBy: 'u1',
      hasComments: false,
      createdByUserId: 'u1',
      messageThreadId: 't1',
      values: [],
    });
    const chunkB = JSON.stringify({
      id: 'm3',
      createdAt: '2024-01-01',
      createdBy: 'u1',
      hasComments: false,
      createdByUserId: 'u1',
      messageThreadId: 't1',
      values: [
        {
          id: 'v1',
          name: 'x',
          type: 'INPUT',
          value: 'y',
          channels: {},
          createdAt: '2024-01-01',
          createdBy: 'me',
          createdByUserId: 'me',
        },
      ],
    });

    const fetchMock = vi.fn(
      async () =>
        new Response(
          bodyFromChunks([`data: ${chunkA}\n\n`, `data: ${chunkB}\n\n`]),
          { status: 200 }
        )
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    const result = await addInputToMessage({
      messageId: 'm1',
      name: 'test',
      value: 'v',
      channels: null,
    });

    // Last frame wins (final message after streaming completes).
    expect(result.id).toBe('m3');
    expect(result.values?.length).toBe(1);

    const [rawUrl, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [string, RequestInit];
    expect(rawUrl).toBe('https://api.test/messages/m1/values');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Accept).toBe(
      'text/event-stream'
    );
  });

  it('addInputToMessage rejects when the server returns a non-2xx status', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('err', { status: 500 })
    ) as typeof fetch;

    await expect(
      addInputToMessage({
        messageId: 'm1',
        name: 'test',
        value: 'v',
        channels: null,
      })
    ).rejects.toThrow(/status 500/);
  });
});
