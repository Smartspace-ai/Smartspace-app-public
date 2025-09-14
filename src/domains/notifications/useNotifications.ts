import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsKeys } from './queryKeys';
import {
	fetchNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from './service';

const LIMIT = 10;

export function useNotificationsQuery(isUnreadOnly: boolean) {
	return useInfiniteQuery({
		queryKey: notificationsKeys.infinite({ unreadOnly: isUnreadOnly }),
		queryFn: async ({ pageParam = 1 }) => fetchNotifications(pageParam, isUnreadOnly),
		getNextPageParam: (lastPage, pages) =>
			lastPage.items.length === LIMIT ? pages.length + 1 : undefined,
		initialPageParam: 1,
	});
}



export function useNotificationMutations() {
	const queryClient = useQueryClient();

	const markAsReadMutation = useMutation({
		mutationFn: (id: string) => markNotificationAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
		},
	});

	const markAllAsReadMutation = useMutation({
		mutationFn: () => markAllNotificationsAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
		},
	});

	return { markAsReadMutation, markAllAsReadMutation };
}


