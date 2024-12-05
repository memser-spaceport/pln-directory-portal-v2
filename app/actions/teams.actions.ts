"use server";

import { ITeamResponse } from "@/types/teams.types";
import { getHeader } from "@/utils/common.utils";
import { ITEMS_PER_PAGE } from "@/utils/constants";

const teamsAPI = `${process.env.DIRECTORY_API_URL}/v1/teams`;

export const getTeamList = async (queryParams: any, currentPage = 1, limit = ITEMS_PER_PAGE) => {
    const requestOptions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'force-cache', next: { tags: ['team-list'] } };
    const response = await fetch(`${teamsAPI}?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`, requestOptions);
    const result = await response.json();
    if (!response?.ok) {
      return { isError: true };
    }
    const formattedData = result?.teams?.map((team: ITeamResponse) => {
      return {
        id: team?.uid,
        name: team?.name,
        logo: team?.logo?.url,
        shortDescription: team?.shortDescription,
        industryTags: team?.industryTags || [],
      };
    });
    return { data: formattedData, totalItems: result?.count };
  };