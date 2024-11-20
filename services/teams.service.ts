import { ITeamMemberRole } from '@/types/members.types';
import { ITeamListOptions, ITeamResponse, ITeamsSearchParams } from '@/types/teams.types';
import { getHeader } from '@/utils/common.utils';
import { getTagsFromValues, parseTeamsFilters } from '@/utils/team.utils';
import { getFocusAreas } from './common.service';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';


const teamsAPI = `${process.env.DIRECTORY_API_URL}/v1/teams`

export const getTeamList = async (queryParams: any, currentPage: number, limit: number) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'force-cache', next: { tags: ['teams-list'], revalidate: 3600 * 24 } };
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
};

export const getTeamListFilters = async () => {
  const res = await fetch(`${process.env.APPLICATION_BASE_URL}/teams/api`, {
    cache: 'force-cache',
    next: {
      tags: ['teams-filter'],
      revalidate: 3600 * 24
    },
  });
  if(!res.ok) {
    console.log('Error in fetching team filters');
    return { error: { statusText: res.statusText } };
  }
  const data = await res.json();
  return data;
};

export const getTeamListFiltersForOptions = async (options: any) => {
  const res = await fetch(`${process.env.APPLICATION_BASE_URL}/teams/api?${new URLSearchParams(options)}`, {
    cache: 'force-cache',
    next: {
      tags: ['teams-filter-available'],
      revalidate: 3600 * 24
    },
  });
  if(!res.ok) {
    console.log('Error in fetching team filters');
    return { error: { statusText: res.statusText } };

  }
  const data = await res.json();
  return data;
};

export const getFocusAreasForTeams = async (queryParams: any) => {
  const includeFriends = queryParams?.includeFriends ?? 'false';
  const officeHoursFilter = queryParams?.officeHoursOnly ?? false;
  const url = `${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=Team&plnFriend=${includeFriends}&officeHours=${officeHoursFilter}&${new URLSearchParams(queryParams)}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'force-cache',
    next: { tags: ['focus-areas'], revalidate: 3600 * 24 },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return await { data: await response.json() };
};
























export const getAllTeams = async (authToken: string, queryParams: any, currentPage: number, limit: number) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(authToken), cache: 'force-cache', next: { tags: ['teams-list'] } };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`, requestOPtions);
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
      longDescription: team?.longDescription,
      industryTags: team?.industryTags || [],
      fundingStage: team?.fundingStage,
      membershipSources: team?.membershipSources || [],
      technologies: team?.technologies || [],
      memberIds,
    };
  });
  return { data: { formattedData } };
};

export const getTeamsFilters = async (options: ITeamListOptions, searchParams: ITeamsSearchParams) => {
  let totalTeams = 0;

  const [allTeams, availableValuesByFilter, focusAreaResposne] = await Promise.all([getTeamList({}, 0, 0), getTeamsByFilters(options), getFocusAreas('Team', searchParams)]);

  if (allTeams?.error || availableValuesByFilter?.error || focusAreaResposne?.error) {
    return { error: { statusText: allTeams?.error?.statusText } };
  }
  totalTeams = availableValuesByFilter?.data?.formattedData?.length;

  const formattedValuesByFilter = parseTeamsFilters(allTeams?.data?.formattedData);
  const formattedAvailableValuesByFilter = parseTeamsFilters(availableValuesByFilter?.data?.formattedData);

  const focusAreaQuery = searchParams?.focusAreas;
  const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR);
  const selectedFocusAreas = focusAreaFilters?.length > 0 ? focusAreaResposne?.data?.filter((focusArea: any) => focusAreaFilters.includes(focusArea.title)) : [];

  const formattedFilters = {
    tags: getTagsFromValues(formattedValuesByFilter?.tags, formattedAvailableValuesByFilter?.tags, searchParams?.tags),
    membershipSources: getTagsFromValues(formattedValuesByFilter?.membershipSources, formattedAvailableValuesByFilter?.membershipSources, searchParams?.membershipSources),
    fundingStage: getTagsFromValues(formattedValuesByFilter?.fundingStage, formattedAvailableValuesByFilter?.fundingStage, searchParams?.fundingStage),
    technology: getTagsFromValues(formattedValuesByFilter?.technology, formattedAvailableValuesByFilter?.technology, searchParams?.technology),
    focusAreas: {
      rawData: focusAreaResposne?.data,
      selectedFocusAreas,
    },
  };
  return { data: { formattedFilters, totalTeams } };
};

const getTeamsByFilters = async (options: ITeamListOptions) => {
  return await getAllTeams('', { ...options, pagination: false, select: 'industryTags.title,membershipSources.title,fundingStage.title,technologies.title' }, 0, 0);
};

export const getTeamUIDByAirtableId = async (id: string) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const query = { airtableRecId: id, select: 'uid' };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?${new URLSearchParams(query)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return result;
};

export const updateTeam = async (payload: any, authToken: string, teamUid: string) => {
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${teamUid}`, {
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
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${id}?${new URLSearchParams(options)}`, requestOPtions);
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
  };
  return { data: { formatedData } };
};

export const getTeamsForProject = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?select=uid,name,shortDescription,logo.url&&pagination=false&&with=teamMemberRoles`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return { isError: true, message: response?.status };
  }

  const result = await response.json();

  const formattedData = result?.map((team: any) => {
    return {
      uid: team.uid,
      name: team.name,
      logo: team.logo?.url ? team.logo.url : null,
    };
  });

  return { data: formattedData };
};

export const getTeamInfo = async (teamUid: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${teamUid}`, {
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
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?pagination=false&select=uid,name,logo.url`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  const formattedData: any = result
    .map((info: any) => {
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
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?name__icontains=${searchTerm}&select=uid,name,logo.url`, requestOptions);
  if (!response?.ok) {
    return {
      error: { status: response?.status, statusText: response?.statusText },
    };
  }
  const result = await response?.json();
  return result.map((item: any) => {
    return { label: item.name, value: item.uid, logo: item.logo?.url };
  });
};

export const getMemberTeams = async (memberId: string) => {
  const requestOptions = { method: 'GET', headers: getHeader('') };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?memberId=${memberId}`, requestOptions);
  if (!response?.ok) {
    return {
      error: { status: response?.status, statusText: response?.statusText },
    };
  }
  const result = await response?.json();

  return result.map((item: any) => {
    return { label: item.name, value: item.uid };
  });
};
