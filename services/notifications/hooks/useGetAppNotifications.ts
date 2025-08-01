import { useQuery } from '@tanstack/react-query';
import { NotificationsQueryKeys } from '@/services/notifications/constants';
import { getFollowUps } from '@/services/office-hours.service';

async function fetcher(userId: string, authToken: string) {
  console.log('GEt follow ups');
  const response = await getFollowUps(userId, authToken, 'PENDING,CLOSED');

  return response?.data ?? [];
}

export function useGetAppNotifications(userId: string | undefined, authToken: string) {
  return useQuery({
    queryKey: [NotificationsQueryKeys.GET_ALL_NOTIFICATIONS, userId, authToken],
    queryFn: () => fetcher(userId ?? '', authToken),
    enabled: Boolean(userId && authToken),
    staleTime: 15000,
  });
}
