'use server';

import { IMemberListOptions } from '@/types/members.types';
import { getHeader } from '@/utils/common.utils';
import { handleHostAndSpeaker } from '@/utils/member.utils';

export const getMemberListForQuery = async (query: string, currentPage: number, limit: number, authToken?: string) => {
  // handleHostAndSpeaker(options);
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members-search?page=${currentPage}&limit=${limit}&${query}`, {
    // cache: 'force-cache',
    method: 'GET',
    next: { tags: ['member-list'] },
    headers: getHeader(authToken ?? ''),
  });

  // http://localhost:3000/v1/members-search?hasOfficeHours=true&topics=ai&topics=product&roles=Engineer&search=test&includePlnFriend=true&sort=name%3Aasc&page=1&limit=10&roles=Investor%20Optimization%20Producer

  if (!response.ok) {
    return { isError: true, error: { status: response.status, statusText: response.statusText } };
  }

  const result = await response.json();

  // console.log(result);

  const formattedMembers: any = result?.members?.map((member: any) => {
    const teams =
      member?.teamMemberRoles?.map((teamMemberRole: any) => ({
        id: teamMemberRole.team?.uid || '',
        name: teamMemberRole.team?.name || '',
        role: teamMemberRole.role || 'Contributor',
        teamLead: !!teamMemberRole.teamLead,
        mainTeam: !!teamMemberRole.mainTeam,
      })) || [];
    const mainTeam = teams.find((team: any) => team.mainTeam);
    const teamLead = teams.some((team: any) => team.teamLead);
    return {
      id: member.uid,
      name: member.name,
      profile: member.image?.url || null,
      officeHours: member.officeHours || null,
      skills: member.skills || [],
      teams,
      location: member?.location,
      mainTeam,
      teamLead,
      isVerified: member.isVerified || false,
      openToWork: member.openToWork || false,
    };
  });
  return {
    total: result?.total,
    items: formattedMembers,
  };
};
