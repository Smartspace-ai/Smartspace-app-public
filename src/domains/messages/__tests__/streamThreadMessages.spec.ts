import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockMessageElementParse,
  mockValueElementParse,
  mockErrorElementParse,
  mockGetAccessToken,
} = vi.hoisted(() => ({
  mockMessageElementParse: vi.fn((data: unknown) => data),
  mockValueElementParse: vi.fn((data: unknown) => data),
  mockErrorElementParse: vi.fn((data: unknown) => data),
  mockGetAccessToken: vi.fn(async () => 'test-token'),
}));

vi.mock('@smartspace/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      messageThreadsThreadMessagesIdMessages: vi.fn(),
    }),
  },
  ChatZod: {
    messageThreadsThreadMessagesIdMessagesResponse: {
      shape: {
        data: {
          element: {
            parse: mockMessageElementParse,
            shape: {
              values: { element: { parse: mockValueElementParse } },
              errors: { element: { parse: mockErrorElementParse } },
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

import { streamThreadMessages } from '@/domains/messages';

function bodyFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

function dto(id: string, text: string) {
  return {
    id,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'bot',
    createdByUserId: 'bot',
    hasComments: false,
    messageThreadId: 't1',
    errors: [],
    values: [
      {
        id: `${id}-v1`,
        name: 'response',
        type: 'Output',
        value: text,
        channels: {},
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'bot',
        createdByUserId: 'bot',
      },
    ],
  };
}

describe('streamThreadMessages', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockMessageElementParse.mockClear();
    mockMessageElementParse.mockImplementation((data: unknown) => data);
    mockValueElementParse.mockClear();
    mockValueElementParse.mockImplementation((data: unknown) => data);
    mockErrorElementParse.mockClear();
    mockErrorElementParse.mockImplementation((data: unknown) => data);
    mockGetAccessToken.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns not-found when server responds 404', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 404 }) as unknown as Response
    ) as typeof fetch;

    const result = await streamThreadMessages({
      threadId: 't1',
      signal: new AbortController().signal,
      onSnapshot: () => {
        throw new Error('should not be called');
      },
      onMessage: () => {
        throw new Error('should not be called');
      },
    });

    expect(result).toEqual({ status: 'not-found' });
  });

  it('delivers snapshot, per-message upserts, and thread summaries on snapshot + terminal frames', async () => {
    const threadRunning = {
      id: 't1',
      workSpaceId: 'w1',
      name: 'My Thread',
      totalMessages: 2,
      favorited: false,
      isFlowRunning: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 'u1',
      lastUpdatedAt: '2024-01-01T00:00:00Z',
      lastUpdatedByUserId: 'u1',
    };
    const threadDone = { ...threadRunning, isFlowRunning: false };

    const snapshotFrame = `data: ${JSON.stringify({
      snapshot: [dto('m1', 'hi'), dto('m2', 'world')],
      thread: threadRunning,
      terminal: false,
    })}\n\n`;
    const upsertFrame = `data: ${JSON.stringify({
      messageId: 'm2',
      message: dto('m2', 'world!'),
      terminal: false,
    })}\n\n`;
    // Real backend terminal frame: message is null and the thread summary
    // carries the authoritative isFlowRunning: false.
    const terminalFrame = `data: ${JSON.stringify({
      messageId: 'm2',
      message: null,
      terminal: true,
      thread: threadDone,
    })}\n\n`;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          bodyFromChunks([snapshotFrame, upsertFrame, terminalFrame]),
          { status: 200 }
        )
    ) as typeof fetch;

    const snapshots: Array<{ count: number }> = [];
    const upserts: Array<{ messageId: string; terminal: boolean }> = [];
    const threadCalls: Array<{ isFlowRunning: boolean }> = [];

    const result = await streamThreadMessages({
      threadId: 't1',
      signal: new AbortController().signal,
      onSnapshot: (messages) => snapshots.push({ count: messages.length }),
      onMessage: (messageId, _m, terminal) =>
        upserts.push({ messageId, terminal }),
      onThread: (thread) =>
        threadCalls.push({ isFlowRunning: thread.isFlowRunning }),
    });

    expect(snapshots).toEqual([{ count: 2 }]);
    expect(upserts).toEqual([{ messageId: 'm2', terminal: false }]);
    expect(threadCalls).toEqual([
      { isFlowRunning: true },
      { isFlowRunning: false },
    ]);
    expect(result).toEqual({ status: 'completed' });
  });

  it('attaches bearer token to the GET and targets the thread endpoint', async () => {
    const fetchMock = vi.fn(
      async () => new Response(bodyFromChunks([]), { status: 200 })
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    await streamThreadMessages({
      threadId: 't1',
      signal: new AbortController().signal,
      onSnapshot: () => undefined,
      onMessage: () => undefined,
    });

    const [rawUrl, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0] as [string, RequestInit];
    expect(rawUrl).toBe('https://api.test/MessageThreads/t1/messages/stream');
    expect(rawUrl).not.toContain('since=');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
    expect(headers.Accept).toBe('text/event-stream');
  });

  it('throws on non-2xx non-404 responses', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('nope', { status: 500 })
    ) as typeof fetch;

    await expect(
      streamThreadMessages({
        threadId: 't1',
        signal: new AbortController().signal,
        onSnapshot: () => undefined,
        onMessage: () => undefined,
      })
    ).rejects.toThrow(/status 500/);
  });

  it('emits onMessage for chunk #0 and onDelta for appended outputs', async () => {
    const threadRunning = {
      id: 't1',
      workSpaceId: 'w1',
      name: 'Thread',
      totalMessages: 1,
      favorited: false,
      isFlowRunning: true,
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 'u1',
      lastUpdatedAt: '2024-01-01T00:00:00Z',
      lastUpdatedByUserId: 'u1',
    };
    const threadDone = { ...threadRunning, isFlowRunning: false };

    // Chunk #0: full Message (inputs present, outputs empty).
    const messageFrame = `data: ${JSON.stringify({
      messageId: 'm1',
      message: {
        ...dto('m1', ''),
        values: [
          {
            id: 'm1-prompt',
            name: 'prompt',
            type: 'Input',
            value: 'hello',
            channels: {},
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'user',
            createdByUserId: 'u1',
          },
        ],
      },
      terminal: false,
      thread: threadRunning,
    })}\n\n`;

    // Chunk #1: cumulative delta carrying the response output so far.
    const deltaFrame1 = `data: ${JSON.stringify({
      delta: {
        messageId: 'm1',
        outputs: [
          {
            id: 'm1-o1',
            name: 'response',
            type: 'Output',
            value: 'Hel',
            channels: {},
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'bot',
            createdByUserId: 'bot',
          },
        ],
        errors: [],
      },
      terminal: false,
    })}\n\n`;

    // Chunk #2: cumulative delta with the same (name, type) extended.
    const deltaFrame2 = `data: ${JSON.stringify({
      delta: {
        messageId: 'm1',
        outputs: [
          {
            id: 'm1-o1',
            name: 'response',
            type: 'Output',
            value: 'Hello',
            channels: {},
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'bot',
            createdByUserId: 'bot',
          },
        ],
        errors: [],
      },
      terminal: false,
    })}\n\n`;

    // Terminal: null message, thread summary with isFlowRunning: false.
    const terminalFrame = `data: ${JSON.stringify({
      messageId: 'm1',
      message: null,
      terminal: true,
      thread: threadDone,
    })}\n\n`;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          bodyFromChunks([
            messageFrame,
            deltaFrame1,
            deltaFrame2,
            terminalFrame,
          ]),
          { status: 200 }
        )
    ) as typeof fetch;

    const messageCalls: Array<{ id: string; outputCount: number }> = [];
    const deltaCalls: Array<{
      id: string;
      outputCount: number;
      firstValue: unknown;
    }> = [];
    const threadCalls: Array<{ running: boolean }> = [];

    await streamThreadMessages({
      threadId: 't1',
      signal: new AbortController().signal,
      onSnapshot: () => undefined,
      onMessage: (id, msg) =>
        messageCalls.push({
          id,
          outputCount:
            msg.values?.filter((v) => v.type === ('Output' as unknown))
              .length ?? 0,
        }),
      onDelta: (id, delta) =>
        deltaCalls.push({
          id,
          outputCount: delta.outputs.length,
          firstValue: delta.outputs[0]?.value,
        }),
      onThread: (thread) => threadCalls.push({ running: thread.isFlowRunning }),
    });

    expect(messageCalls).toEqual([{ id: 'm1', outputCount: 0 }]);
    expect(deltaCalls).toEqual([
      { id: 'm1', outputCount: 1, firstValue: 'Hel' },
      { id: 'm1', outputCount: 1, firstValue: 'Hello' },
    ]);
    expect(threadCalls).toEqual([{ running: true }, { running: false }]);
  });

  it('skips malformed JSON frames without aborting the stream', async () => {
    const bad = `data: {not valid json}\n\n`;
    const good = `data: ${JSON.stringify({
      messageId: 'm1',
      message: dto('m1', 'ok'),
      terminal: true,
    })}\n\n`;

    globalThis.fetch = vi.fn(
      async () => new Response(bodyFromChunks([bad, good]), { status: 200 })
    ) as typeof fetch;

    const received: Array<string> = [];
    await streamThreadMessages({
      threadId: 't1',
      signal: new AbortController().signal,
      onSnapshot: () => undefined,
      onMessage: (messageId) => received.push(messageId),
    });

    expect(received).toEqual(['m1']);
  });
});
