import { ITeamMemberRole } from '@/types/members.types';
import { ITeamResponse } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';

export async function GET() {
  const currentPage = 0;
  const limit= 0;
  const options = { pagination: false, select: 'industryTags.title,membershipSources.title,fundingStage.title,technologies.title' } as any;

  const requestOPtions: RequestInit = {
    method: 'GET',
    headers: getHeader(''),
    cache: 'force-cache',
    next: {
      tags: ['teams-api'],
    },
  };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?page=${currentPage}&limit=${limit}&${new URLSearchParams(options)}`, requestOPtions);
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.map((team: ITeamResponse) => {
    const memberIds = team?.teamMemberRoles?.length ? [...new Set(team?.teamMemberRoles.map((teamMemberRole: ITeamMemberRole) => teamMemberRole.member?.uid || ''))] : [];

    return {
      id: team?.uid,
      name: team?.name,
      logo: team?.logo?.url,
      shortDescription: team?.shortDescription,
      industryTags: team?.industryTags || [],
      fundingStage: team?.fundingStage,
      membershipSources: team?.membershipSources || [],
      technologies: team?.technologies || [],
      memberIds,
    };
  });

  return Response.json({ data: { formattedData } }) as any;
}
