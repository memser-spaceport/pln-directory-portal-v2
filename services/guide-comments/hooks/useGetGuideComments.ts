import { useQuery } from '@tanstack/react-query';

import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { GuideCommentsQueryKeys } from '../constants';
import type { IGuideCommentsResponse } from '../guide-comments.types';

async function fetchGuideComments(articleUid: string): Promise<IGuideCommentsResponse> {
  const { authToken } = getCookiesFromClient();
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/articles/${articleUid}/comments`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
}

export function useGetGuideComments(articleUid: string) {
  return useQuery({
    queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid],
    queryFn: () => fetchGuideComments(articleUid),
    enabled: !!articleUid,
    staleTime: 60_000,
  });
}
