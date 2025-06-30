import { getHeader } from '@/utils/common.utils';

export const getRecommendationRoles = async (): Promise<string[] | { isError: boolean; error: { status: number; statusText: string } }> => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/recommendations/settings/roles`, {
    cache: 'force-cache',
    method: 'GET',
    headers: getHeader(''),
    next: { tags: ['recommendation-roles'] },
  });

  if (!response.ok) {
    return { isError: true, error: { status: response.status, statusText: response.statusText } };
  }

  return await response.json();
};
