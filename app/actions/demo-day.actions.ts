'use server';

import { getHeader } from '@/utils/common.utils';

export type DemoDayState = {
  uid: string;
  access: 'none' | 'INVESTOR' | 'FOUNDER';
  date: string;
  title: string;
  description: string;
  status: 'NONE' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'REGISTRATION_OPEN';
  isDemoDayAdmin: boolean;
  isEarlyAccess?: boolean;
  confidentialityAccepted: boolean;
  investorsCount: number;
  teamsCount: number;
};

export const getDemoDayState = async (slug: string, memberUid?: string, authToken?: string) => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${slug}${memberUid ? `?memberUid=${memberUid}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeader(authToken ?? ''),
  });

  if (!response?.ok) {
    return { isError: true, status: response.status, message: response.statusText };
  }

  const data: DemoDayState = await response.json();

  return { data };
};

export const getMemberInfo = async (memberUid: string, authToken?: string) => {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${memberUid}?${new URLSearchParams({ with: 'image,skills,location,teamMemberRoles.team' })}`,
    {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken ?? ''),
    },
  );

  if (!response?.ok) {
    return { isError: true, status: response.status, message: response.statusText };
  }

  const result = await response.json();
  const teamMemberRoles =
    result.teamMemberRoles?.map((tm: any) => ({
      teamTitle: tm.team?.name,
      teamUid: tm.teamUid,
      role: tm.role,
      team: tm.team,
      investmentTeam: tm.investmentTeam,
    })) || [];

  const skills =
    result.skills?.map((sk: any) => ({
      id: sk.uid,
      name: sk.title,
    })) || [];

  const projectContributions =
    result.projectContributions?.map((pc: any) => ({
      uid: pc.uid,
      role: pc?.role,
      projectName: pc?.project?.name ?? '',
      projectUid: pc?.project?.uid,
      startDate: pc?.startDate,
      endDate: pc?.endDate,
      description: pc?.description ?? '',
      currentProject: pc?.currentProject ?? false,
    })) || [];

  const formatted = {
    ...result,
    imageUrl: result?.image?.url,
    moreDetails: result.moreDetails ?? '',
    openToWork: result.openToWork ?? false,
    officeHours: result.officeHours ?? '',
    projectContributions: projectContributions,
    teamMemberRoles: teamMemberRoles,
    skills: skills,
  };

  return { data: formatted };
};
