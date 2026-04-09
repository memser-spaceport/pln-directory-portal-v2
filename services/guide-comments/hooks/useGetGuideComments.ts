import { useQuery } from '@tanstack/react-query';

import { GuideCommentsQueryKeys } from '../constants';
import type { IGuideComment } from '../guide-comments.types';

async function fetchGuideComments(_articleUid: string): Promise<IGuideComment[]> {
  // TODO: Replace with real API call when endpoint is available
  // const { authToken } = getCookiesFromClient();
  // const response = await customFetch(
  //   `${process.env.DIRECTORY_API_URL}/v1/articles/${_articleUid}/comments`,
  //   { method: 'GET', headers: { Authorization: `Bearer ${authToken}` } },
  //   true,
  // );
  // if (!response?.ok) throw new Error('Failed to fetch comments');
  // return response.json();
  return [];
}

export function useGetGuideComments(articleUid: string) {
  return useQuery({
    queryKey: [GuideCommentsQueryKeys.GET_GUIDE_COMMENTS, articleUid],
    queryFn: () => fetchGuideComments(articleUid),
    enabled: !!articleUid,
    staleTime: 60_000,
  });
}
