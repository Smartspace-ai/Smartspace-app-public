export const notificationsKeys = {
	all: ['notifications'] as const,

	lists: () => [...notificationsKeys.all, 'list'] as const,
	list: (opts?: { unreadOnly?: boolean }) =>
		[...notificationsKeys.lists(), { unreadOnly: !!opts?.unreadOnly }] as const,

	infinite: (opts?: { unreadOnly?: boolean }) =>
		[...notificationsKeys.lists(), 'infinite', { unreadOnly: !!opts?.unreadOnly }] as const,

	mutations: {
		markAsRead: () => [...notificationsKeys.all, 'mutations', 'markAsRead'] as const,
		markAllAsRead: () => [...notificationsKeys.all, 'mutations', 'markAllAsRead'] as const,
	},
};
