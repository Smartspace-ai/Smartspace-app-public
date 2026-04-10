export const threadUsersKeys = {
  all: ['thread-users'] as const,
  lists: () => [...threadUsersKeys.all, 'list'] as const,
  list: (threadId: string) =>
    [...threadUsersKeys.lists(), { threadId }] as const,

  mutations: () => [...threadUsersKeys.all, 'mutations'] as const,
  addUser: (threadId: string) =>
    [...threadUsersKeys.mutations(), 'add', { threadId }] as const,
  removeUser: (threadId: string) =>
    [...threadUsersKeys.mutations(), 'remove', { threadId }] as const,
};
