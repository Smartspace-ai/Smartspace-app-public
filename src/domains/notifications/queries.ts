import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationsKeys } from './queryKeys';
import {
	fetchNotifications
} from './service';


export function useNotificationsQuery(isUnreadOnly: boolean, LIMIT = 10) {
	return useInfiniteQuery({
		queryKey: notificationsKeys.infinite({ unreadOnly: isUnreadOnly }),
		queryFn: async ({ pageParam = 1 }) => fetchNotifications(pageParam, isUnreadOnly),
		getNextPageParam: (lastPage, pages) =>
			lastPage.items.length === LIMIT ? pages.length + 1 : undefined,
		initialPageParam: 1,
	});
}

