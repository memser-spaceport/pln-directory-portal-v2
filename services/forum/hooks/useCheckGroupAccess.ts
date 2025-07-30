import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type GroupAccessResponse = {
  hasAccess: boolean;
};

async function fetcher(): Promise<GroupAccessResponse> {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/forum/check-group-access`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    },
    !token,
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
