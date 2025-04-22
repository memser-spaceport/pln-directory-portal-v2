'use server'

import { IMemberListOptions } from "@/types/members.types";
import { getHeader } from "@/utils/common.utils";
import { handleHostAndSpeaker } from "@/utils/member.utils";

export const getMemberListForQuery = async (options: IMemberListOptions, currentPage: number, limit: number, authToken?: string) => {
  
  handleHostAndSpeaker(options);
  console.log(`https://protocol-labs-network-api.herokuapp.com/v1/members?page=${currentPage}&limit=${limit}${options ? '&' + new URLSearchParams(options as any) : ''}`)
  const response = await fetch(`https://protocol-labs-network-api.herokuapp.com/v1/members?page=${currentPage}&limit=${limit}${options ? '&' + new URLSearchParams(options as any) : ''}`, {
      cache: 'no-store',
      method: 'GET',
      next: { tags: ['member-list'] },
      headers: getHeader(authToken?? ''),
    });
  
    if(!response.ok){
      return { isError: true, error: { status: response.status, statusText: response.statusText } };
    }
    const result = await response.json();
    const formattedMembers: any = result?.members?.map((member: any) => {
      const teams = member?.teamMemberRoles?.map((teamMemberRole: any) => ({
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
      }
    })
    return {
      total: result?.count,
      items: formattedMembers,
    };
  }
  