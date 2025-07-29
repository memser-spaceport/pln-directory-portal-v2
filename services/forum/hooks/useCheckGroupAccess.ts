import { useQuery } from '@tanstack/react-query';
import { ForumQueryKeys } from '@/services/forum/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

type GroupAccessResponse = {
  hasAccess: boolean;
};

async function fetcher(): Promise<GroupAccessResponse> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/forum/check-group-access`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
    false,
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
