import { ITeamResponse } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';

export async function GET(authToken: string, queryParams: any, currentPage: number, limit: number) {
  const requestOPtions: RequestInit = {
    method: 'GET',
    headers: getHeader(authToken),
    next: {
      tags: ['teams'],
    },
  };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`, requestOPtions);
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.map((team: ITeamResponse) => {
    return {
      id: team?.uid,
      name: team?.name,
      logo: team?.logo?.url,
      shortDescription: team?.shortDescription,
      industryTags: team?.industryTags || [],
    };
  });

  return { data: { formattedData } };
}
