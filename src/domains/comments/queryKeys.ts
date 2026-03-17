export const commentsKeys = {
  all: ['comments'] as const,

  lists: () => [...commentsKeys.all, 'list'] as const,
  list: (threadId: string) => [...commentsKeys.lists(), { threadId }] as const,

  details: () => [...commentsKeys.all, 'detail'] as const,
  detail: (commentId: string) => [...commentsKeys.details(), { commentId }] as const,

  mutations: () => [...commentsKeys.all, 'mutation'] as const,
  mutation: {
    add: (threadId: string) => [...commentsKeys.mutations(), 'add', { threadId }] as const,
    update: (commentId: string) => [...commentsKeys.mutations(), 'update', { commentId }] as const,
    delete: (commentId: string) => [...commentsKeys.mutations(), 'delete', { commentId }] as const,
  },
};
