import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';

export interface DemoDaySubscriptionSettings {
  demoDaySubscriptionEnabled: boolean;
}

async function fetcher(uid: string | undefined): Promise<DemoDaySubscriptionSettings | null> {
  if (!uid) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/demo-day-subscription`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day subscription settings');
  }

  return await response.json();
}

export function useGetDemoDaySubscription(
  uid: string | undefined,
  initialData?: DemoDaySubscriptionSettings,
) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_DEMO_DAY_SUBSCRIPTION, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
    initialData,
  });
}

