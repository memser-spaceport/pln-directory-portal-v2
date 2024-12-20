import { ITeamMemberRole } from '@/types/members.types';
import { ITeamResponse } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';

const teamsAPI = `${process.env.DIRECTORY_API_URL}/v1/teams`;


// get all teams filters
export const getTeamListFilters = async (options: any) => {
  const queries = { ...options, pagination: false, select: 'industryTags.title,membershipSources.title,fundingStage.title,technologies.title' } as any;

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: getHeader(''),
    cache: 'force-cache',
    next: {
      tags: ['team-filters'],
    },
  };

  const response = await fetch(`${teamsAPI}/filters?${new URLSearchParams(queries)}`, requestOptions);
  const result = await response.json();
  if (!response?.ok) {
    return { isError: true };
  }
  const formattedData = { tags: result?.industryTags || [], fundingStage: result?.fundingStages || [], membershipSources: result?.membershipSources || [], technology: result?.technologies || [] };

  return { data: formattedData };
};

export const getAllTeams = async (authToken: string, queryParams: any, currentPage: number, limit: number) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(authToken), cache: 'no-cache' };
  const response = await fetch(`${teamsAPI}?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`, requestOPtions);
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.teams?.map((team: ITeamResponse) => {
    const memberIds = team?.teamMemberRoles?.length ? [...new Set(team?.teamMemberRoles.map((teamMemberRole: ITeamMemberRole) => teamMemberRole.member?.uid || ''))] : [];
    return {
      id: team?.uid,
      name: team?.name,
      logo: team?.logo?.url,
      shortDescription: team?.shortDescription,
      longDescription: team?.longDescription,
      industryTags: team?.industryTags || [],
      fundingStage: team?.fundingStage,
      membershipSources: team?.membershipSources || [],
      technologies: team?.technologies || [],
      memberIds,
    };
  });
  return { data: { formattedData, totalItems: result?.count } };
};

export const getTeamUIDByAirtableId = async (id: string) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const query = { airtableRecId: id, select: 'uid' };
  const response = await fetch(`${teamsAPI}?${new URLSearchParams(query)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return result;
};

export const updateTeam = async (payload: any, authToken: string, teamUid: string) => {
  const result = await fetch(`${teamsAPI}/${teamUid}`, {
    cache: 'no-store',
    method: 'PUT',
    body: JSON.stringify(payload),
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

  const output = await result.json();
  return {
    data: output,
  };
};

export const getTeam = async (id: string, options: string | string[][] | Record<string, string> | URLSearchParams | undefined) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const response = await fetch(`${teamsAPI}/${id}?${new URLSearchParams(options)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formatedData = {
    id: result?.uid,
    name: result?.name,
    logo: result?.logo?.url,
    logoUid: result?.logo?.uid,
    shortDescription: result?.shortDescription,
    website: result?.website,
    twitter: result?.twitterHandler,
    contactMethod: result?.contactMethod,
    linkedinHandle: result?.linkedinHandler,
    membershipSources: result?.membershipSources,
    longDescription: result?.longDescription,
    technologies: result?.technologies,
    industryTags: result?.industryTags,
    fundingStage: result?.fundingStage,
    role: result?.role,
    maintainingProjects: result?.maintainingProjects,
    contributingProjects: result?.contributingProjects,
    officeHours: result?.officeHours,
    teamFocusAreas: result?.teamFocusAreas,
    eventGuests: result?.eventGuests,
  };
  return { data: { formatedData } };
};

export const getTeamsForProject = async () => {
  const response = await fetch(`${teamsAPI}?select=uid,name,shortDescription,logo.url&&pagination=false&&with=teamMemberRoles`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return { isError: true, message: response?.status };
  }

  const result = await response.json();

  const formattedData = result?.teams?.map((team: any) => {
    return {
      uid: team.uid,
      name: team.name,
      logo: team.logo?.url ? team.logo.url : null,
    };
  });

  return { data: formattedData };
};

export const getTeamInfo = async (teamUid: string) => {
  const response = await fetch(`${teamsAPI}/${teamUid}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { isError: true };
  }

  const result = await response?.json();
  const formatted = { ...result };
  formatted.technologies = [...result.technologies].map((tech) => {
    return {
      id: tech.uid,
      name: tech.title,
    };
  });

  formatted.membershipSources = [...result.membershipSources].map((ms) => {
    return {
      id: ms.uid,
      name: ms.title,
    };
  });

  formatted.industryTags = [...result.industryTags].map((ind) => {
    return {
      id: ind.uid,
      name: ind.title,
    };
  });

  formatted.imageFile = result?.logo?.url ?? '';

  return { data: formatted };
};

export const getTeamsInfoForDp = async () => {
  const response = await fetch(`${teamsAPI}?pagination=false&select=uid,name,logo.url`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  const formattedData: any = result?.teams
    ?.map((info: any) => {
      return {
        id: info?.uid,
        name: info?.name,
        imageFile: info?.logo?.url,
      };
    })
    .sort((a: any, b: any) => a?.name?.localeCompare(b?.name));
  return { data: formattedData };
};

export const searchTeamsByName = async (searchTerm: string) => {
  const requestOptions = { method: 'GET', headers: getHeader('') };
  const response = await fetch(`${teamsAPI}?name__icontains=${searchTerm}&select=uid,name,logo.url`, requestOptions);
  if (!response?.ok) {
    return {
      error: { status: response?.status, statusText: response?.statusText },
    };
  }
  const result = await response?.json();
  return result?.teams?.map((item: any) => {
    return { label: item.name, value: item.uid, logo: item.logo?.url };
  });
};
