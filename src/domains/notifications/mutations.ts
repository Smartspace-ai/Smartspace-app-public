
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsKeys } from './queryKeys';
import {
    markAllNotificationsAsRead,
    markNotificationAsRead
} from './service';



export function useMarkAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: notificationsKeys.mutations.markAsRead(),
		mutationFn: (id: string) => markNotificationAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
		},
	});

}


export function useMarkAllAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: notificationsKeys.mutations.markAllAsRead(),
		mutationFn: () => markAllNotificationsAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
		},
	});

}

