import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type GroupAccessResponse = {
  hasAccess: boolean;
};

async function fetcher(): Promise<GroupAccessResponse> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/forum/check-group-access`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to check group access');
  }

  return response.json();
}

export function useCheckGroupAccess() {
  return useQuery({
    queryKey: [ForumQueryKeys.CHECK_GROUP_ACCESS],
    queryFn: () => fetcher(),
  });
}
