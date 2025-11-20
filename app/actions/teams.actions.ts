'use server';

import { ITeamResponse } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';
import { ITEMS_PER_PAGE } from '@/utils/constants';
import { revalidatePath, revalidateTag } from 'next/cache';

const teamsAPI = `${process.env.DIRECTORY_API_URL}/v1/teams`;
const teamsSearchAPI = `${process.env.DIRECTORY_API_URL}/v1/teams-search`;

export const getTeamList = async (query: string, currentPage = 1, limit = ITEMS_PER_PAGE, authToken?: string) => {
  const requestOptions: RequestInit = {
    method: 'GET',
    headers: getHeader(authToken ?? ''),
    next: { tags: ['team-list'] },
  };
  const response = await fetch(`${teamsSearchAPI}?page=${currentPage}&limit=${limit}&${query}`, requestOptions);
  const result = await response.json();
  if (!response?.ok) {
    return { isError: true };
  }
  const formattedData = result?.teams?.map((team: ITeamResponse) => {
    return {
      id: team?.uid,
      name: team?.name,
      logo: team?.logo?.url,
      tier: team?.tier,
      shortDescription: team?.shortDescription,
      industryTags: team?.industryTags || [],
      asks: team?.asks || [],
    };
  });
  return { data: formattedData, totalItems: result?.total };
};

export const deleteTeam = async (teamUid: string, authToken: string) => {
  try {
    const result = await fetch(`${teamsAPI}/${teamUid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!result.ok) {
      return {
        isError: true,
        status: result.status,
        errorMessage: result.statusText,
      };
    }

    // Revalidate cache to refresh team data
    revalidateTag('team-list');
    revalidateTag('team-detail');
    revalidateTag('team-filters');
    revalidatePath('/teams');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting team:', error);
    return {
      isError: true,
      errorMessage: 'Failed to delete team',
    };
  }
};
