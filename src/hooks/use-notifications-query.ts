import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	fetchNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from '@/apis/notifications';

const LIMIT = 10;

export function useNotificationsQuery(isUnreadOnly: boolean) {
	return useInfiniteQuery({
		queryKey: ['notifications', { unreadOnly: isUnreadOnly }],
		queryFn: async ({ pageParam = 1 }) => fetchNotifications(pageParam, isUnreadOnly),
		getNextPageParam: (lastPage, pages) =>
			lastPage.items.length === LIMIT ? pages.length + 1 : undefined,
		initialPageParam: 1,
	});
}

export function useMarkNotificationAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => markNotificationAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}

export function useMarkAllNotificationsAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => markAllNotificationsAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}


