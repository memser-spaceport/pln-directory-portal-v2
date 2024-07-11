import { IMemberListOptions, IMembersSearchParams } from '@/types/members.types';
import { getHeader } from '@/utils/common.utils';
import { ADMIN_ROLE, PRIVACY_CONSTANTS } from '@/utils/constants';
import { getRoleTagsFromValues, getTagsFromValues, hidePreferences, parseMemberDetails, getUniqueFilters } from '@/utils/member.utils';

export const getMembers = async (options: IMemberListOptions, teamId: string, currentPage: number, limit: number, isLoggedIn: boolean) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?page=${currentPage}&limit=${limit}&${new URLSearchParams(options as any)}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  const formattedData: any = parseMemberDetails(result, teamId, isLoggedIn);
  return { data: { formattedData, status: response?.status } };
};

export const getMembersFilters = async (options: IMemberListOptions, isUserLoggedIn: boolean) => {
  const [valuesByFilter, availableValuesByFilter] = await Promise.all([getMembersFiltersValues({ plnFriend: false }, isUserLoggedIn), getMembersFiltersValues(options, isUserLoggedIn)]);

  if (valuesByFilter?.error || availableValuesByFilter?.error) {
    return { error: {} };
  }
  const parsedValuesByFilter = getUniqueFilters(valuesByFilter.data?.formattedData);
  const parsedAvailableValuesByFilter = getUniqueFilters(availableValuesByFilter?.data?.formattedData);
  return { parsedValuesByFilter, parsedAvailableValuesByFilter };
};

const getMembersFiltersValues = async (options: IMemberListOptions = {}, isUserLoggedIn: boolean) => {
  return await getMembers(
    {
      ...options,
      pagination: false,
      select: 'skills.title,location.metroArea,location.city,location.continent,location.country',
    },
    '',
    0,
    0,
    isUserLoggedIn
  );
};

export const getMemberUidByAirtableId = async (id: string) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const query = { airtableRecId: id, select: 'uid' };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?${new URLSearchParams(query)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return result;
};

export const getMemberRepositories = async (id: string) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${id}/git-projects`, requestOPtions);
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  return result;
};

export const getMember = async (id: string, query: any, isLoggedIn?: boolean, userInfo?: any) => {
  const requestOPtions: RequestInit = { method: 'GET', headers: getHeader(''), cache: 'no-store' };
  const memberResponse = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${id}?${new URLSearchParams(query)}`, requestOPtions);
  // let memberRepository;
  let member;

  if (!memberResponse?.ok) {
    return { error: { status: memberResponse?.status, statusText: memberResponse?.statusText } };
  }

  const result = await memberResponse?.json();

  const teams =
    result.teamMemberRoles?.map((teamMemberRole: any) => ({
      id: teamMemberRole.team?.uid || '',
      name: teamMemberRole.team?.name || '',
      role: teamMemberRole.role || 'Contributor',
      teamLead: !!teamMemberRole.teamLead,
      mainTeam: !!teamMemberRole.mainTeam,
    })) || [];

  const mainTeam = teams.find((team: any) => team?.mainTeam);
  const teamLead = teams.some((team: any) => team?.teamLead);
  member = {
    id: result.uid,
    name: result.name,
    email: result.email,
    profile: result.image?.url,
    githubHandle: result.githubHandler,
    discordHandle: result.discordHandler,
    telegramHandle: result.telegramHandler,
    twitter: result.twitterHandler,
    officeHours: result.officeHours,
    location: result?.location,
    skills: result.skills || [],
    teamLead,
    projectContributions: result.projectContributions ?? null,
    teams,
    mainTeam,
    openToWork: result.openToWork || false,
    linkedinHandle: result.linkedinHandler,
    repositories: [],
    preferences: result.preferences ?? null,
  };

  if (isLoggedIn) {
    const respositorymemberResponse = await getMemberRepositories(member?.id);
    member = { ...member, repositories: respositorymemberResponse };
  }

  if (isLoggedIn && (!userInfo?.roles?.includes(ADMIN_ROLE) || userInfo?.uid === member?.id)) {
    let memberPreferences = member?.preferences;
    let preferences;
    if (!memberPreferences) {
      preferences = JSON.parse(JSON.stringify(PRIVACY_CONSTANTS.DEFAULT_SETTINGS));
    } else {
      preferences = memberPreferences;
    }
    hidePreferences(preferences, member);
  }

  if (!isLoggedIn) {
    member = {
      ...member,
      discordHandle: null,
      email: null,
      githubHandle: null,
      twitter: null,
      repositories: [],
      officeHours: result.officeHours,
      telegramHandle: null,
      linkedinHandle: null,
      location: null,
    };
  }

  return { data: { formattedData: member, status: memberResponse?.status } };
};

export const findRoleByName = async (params: any) => {
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/roles?${new URLSearchParams(params.params as any)}`, params);
  const response = await result.json();
  return response;
};

export const getMemberRoles = async (options: IMemberListOptions) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/roles?${new URLSearchParams(options as any)}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });

  return await response.json();
};

export const getMembersForProjectForm = async (teamId = null) => {
  let response;
  if (teamId) {
    response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?teamMemberRoles.team.uid=${teamId}&&select=uid,name,image.url,teamMemberRoles.teamLead,teamMemberRoles.mainTeam,teamMemberRoles.team,teamMemberRoles.role&&pagination=false&&orderBy=name,asc`);
  } else {
    response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?select=uid,name,image.url,teamMemberRoles.teamLead,teamMemberRoles.mainTeam,teamMemberRoles.team,teamMemberRoles.role&&pagination=false&orderBy=name,asc`);
  }

  if (!response.ok) {
    return { isError: true, message: response.statusText }
  }
  const result = await response.json();
  const formattedData = result?.map((member: any) => {
    const mainTeam = member.teamMemberRoles.find((team: any) => team.mainTeam) || null;
    const teamLead = member.teamMemberRoles.some((team: any) => team.teamLead);
    return {
      uid: member.uid,
      name: member.name,
      logo: member.image?.url ? member.image.url : null,
      teamMemberRoles: member?.teamMemberRoles,
      mainTeam: mainTeam,
      teamLead,
    }
  });

  return {data: formattedData};
};
export const getMemberInfo = async (memberUid: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${memberUid}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });
  if (!response?.ok) {
    return { isError: true };
  }

  const result = await response?.json();
  const teamMemberRoles = result.teamMemberRoles.map((tm: any) => {
    return {
      teamTitle: tm.team.name,
      teamUid: tm.teamUid,
      role: tm.role,
    };
  });

  const skills = result.skills.map((sk: any) => {
    return {
      id: sk.uid,
      name: sk.title,
    };
  });

  const projectContributions = result.projectContributions.map((pc: any) => {
    return {
      role: pc?.role,
      projectName: pc?.project?.name ?? '',
      projectUid: pc?.project?.uid,
      startDate: pc?.startDate,
      endDate: pc?.endDate,
      description: pc?.description ?? '',
      currentProject: pc?.currentProject ?? false
    }
  })
  const formatted = { ...result, moreDetails: result.moreDetails ?? '', officeHours: result.officeHours ?? '', projectContributions: projectContributions, teamMemberRoles: teamMemberRoles, skills: skills };

  return { data: formatted };
};

export const updateUserDirectoryEmail = async (payload: any, uid: string, header: any) => {
  const result = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members/${uid}/email`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: header
  })
  
  if(!result.ok) {
    return {
      isError: true,
      status: result.status,
      message: result.statusText
    }
  }

  const output = await result.json();
  return output;
}

export const getMembersInfoForDp = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/members?pagination=false`, {
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
        id: info.uid,
        name: info.name,
        profile: info.image?.url,
      };
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  return { data: formattedData };
};


export const updateMember = async (uid: string, payload: any, authToken: string) => {
 const result =  await fetch(`${process.env.DIRECTORY_API_URL}/v1/member/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  if(!result.ok) {
    return {
      isError: true,
      errorMessage: result.statusText,
      status: result.status
    }
  }


  const output = await result.json()

  return {
    data: output
  }
}
