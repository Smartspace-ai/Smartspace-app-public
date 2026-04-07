import { describe, expect, it, vi } from 'vitest';

const { mockGetComments, mockPostComments } = vi.hoisted(() => ({
  mockGetComments: vi.fn(),
  mockPostComments: vi.fn(),
}));

vi.mock('@smartspace-ai/api-client', () => ({
  ChatApi: {
    getSmartSpaceChatAPI: () => ({
      getMessageThreadsIdComments: mockGetComments,
      postMessageThreadsIdComments: mockPostComments,
    }),
  },
  ChatZod: {
    getMessageThreadsIdCommentsResponse: {},
    postMessageThreadsIdCommentsResponse: {},
  },
  AXIOS_INSTANCE: {},
}));
vi.mock('@/platform/validation', () => ({
  parseOrThrow: vi.fn((_schema: unknown, data: unknown) => data),
}));

import { addComment, fetchComments } from '@/domains/comments/service';

describe('comments service', () => {
  it('fetchComments returns sorted mapped list', async () => {
    const c1 = {
      id: '1',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 'u',
      createdBy: 'U',
      content: 'a',
      mentionedUsers: [],
      messageThreadId: 't',
    };
    const c2 = {
      id: '2',
      createdAt: '2024-01-02T00:00:00Z',
      createdByUserId: 'u',
      createdBy: 'U',
      content: 'b',
      mentionedUsers: [],
      messageThreadId: 't',
    };
    mockGetComments.mockResolvedValueOnce({ data: { data: [c2, c1] } });
    const res = await fetchComments('t');
    expect(res.map((x) => x.id)).toEqual(['1', '2']);
  });

  it('addComment posts and maps result', async () => {
    const dto = {
      id: '3',
      createdAt: '2024-01-03',
      createdByUserId: 'u',
      createdBy: 'U',
      content: 'c',
      mentionedUsers: [],
      messageThreadId: 't',
    };
    mockPostComments.mockResolvedValueOnce({ data: dto });
    const res = await addComment('t', 'c', []);
    expect(res.id).toBe('3');
    expect(res.messageThreadId).toBe('t');
  });
});
