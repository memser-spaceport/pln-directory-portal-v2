import { ITeamMemberRole } from '@/types/members.types';
import { ITeamResponse } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';
import { getTeamsListOptions, getTeamsOptionsFromQuery } from '@/utils/team.utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams.entries()) as any;
  const optionsFromQuery = getTeamsOptionsFromQuery(queryParams);
  const listOptions: any = getTeamsListOptions(optionsFromQuery);
  const options = { ...listOptions, pagination: false, select: 'industryTags.title,membershipSources.title,fundingStage.title,technologies.title' } as any;

  const requestOPtions: RequestInit = {
    method: 'GET',
    headers: getHeader(''),
    cache: 'force-cache',
    next: {
      tags: ['teams-api'],
      revalidate: 3600 * 24
    },
  };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?${new URLSearchParams(options)}`, requestOPtions);
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.map((team: ITeamResponse) => {
    return {
      industryTags: team?.industryTags || [],
      fundingStage: team?.fundingStage,
      membershipSources: team?.membershipSources || [],
      technologies: team?.technologies || [],
    };
  });

  return Response.json({ data: { formattedData, queryParams } }) as any;
}
