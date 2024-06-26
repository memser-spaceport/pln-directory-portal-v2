import { ITeamMemberRole } from "@/types/members.types";
import { IFormatedTeamProject, ITeamListOptions, ITeamResponse, ITeamsSearchParams } from "@/types/teams.types";
import { getHeader } from "@/utils/common.utils";
import { getTagsFromValues, parseTeamsFilters } from "@/utils/team.utils";
import { getFocusAreas } from "./common.service";
import { URL_QUERY_VALUE_SEPARATOR } from "@/utils/constants";
import { IProjectResponse } from "@/types/project.types";
import { IUserInfo } from "@/types/shared.types";

export const getAllTeams = async (authToken: string, queryParams: any, currentPage: number, limit: number) => {
  const requestOPtions: RequestInit = { method: "GET", headers: getHeader(authToken), cache: "no-store" };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`, requestOPtions);
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.map((team: ITeamResponse) => {
    const memberIds = team?.teamMemberRoles?.length
      ? [
        ...new Set(
          team?.teamMemberRoles.map(
            (teamMemberRole: ITeamMemberRole) => teamMemberRole.member?.uid || ''
          )
        ),
      ]
      : [];
    return {
      id: team?.uid, name: team?.name, logo: team?.logo?.url, shortDescription: team?.shortDescription, longDescription: team?.longDescription, industryTags: team?.industryTags || [],
      fundingStage: team?.fundingStage, membershipSources: team?.membershipSources || [], technologies: team?.technologies || [], memberIds
    };
  });
  return { data: { formattedData } };
};

export const getTeamsFilters = async (options: ITeamListOptions, searchParams: ITeamsSearchParams) => {
  let totalTeams = 0;
  const [allTeams, availableValuesByFilter, focusAreaResposne] = await Promise.all([getTeamsByFilters({}), getTeamsByFilters(options), getFocusAreas('Team', searchParams),]);


  if (allTeams?.error || availableValuesByFilter?.error || focusAreaResposne?.error) { return { error: { statusText: allTeams?.error?.statusText } } }
  totalTeams = availableValuesByFilter?.data?.formattedData?.length;

  const formattedValuesByFilter = parseTeamsFilters(allTeams?.data?.formattedData);
  const formattedAvailableValuesByFilter = parseTeamsFilters(availableValuesByFilter?.data?.formattedData);

  const focusAreaQuery = searchParams?.focusAreas
  const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR);
  const selectedFocusAreas = focusAreaFilters?.length > 0 ? focusAreaResposne?.data?.filter((focusArea: any) => focusAreaFilters.includes(focusArea.title)) : []

  const formattedFilters = {
    tags: getTagsFromValues(formattedValuesByFilter?.tags, formattedAvailableValuesByFilter?.tags, searchParams?.tags),
    membershipSources: getTagsFromValues(formattedValuesByFilter?.membershipSources, formattedAvailableValuesByFilter?.membershipSources, searchParams?.membershipSources),
    fundingStage: getTagsFromValues(formattedValuesByFilter?.fundingStage, formattedAvailableValuesByFilter?.fundingStage, searchParams?.fundingStage),
    technology: getTagsFromValues(formattedValuesByFilter?.technology, formattedAvailableValuesByFilter?.technology, searchParams?.technology),
    focusAreas: {
      rawData: focusAreaResposne?.data,
      selectedFocusAreas
    }
  };
  return { data: { formattedFilters, totalTeams } };
};


const getTeamsByFilters = async (options: ITeamListOptions) => {
  return await getAllTeams("", { ...options, pagination: false, select: "industryTags.title,membershipSources.title,fundingStage.title,technologies.title" }, 0, 0);
};



export const getTeamUIDByAirtableId = async (id: string) => {
  const requestOPtions: RequestInit = { method: "GET", headers: getHeader(""), cache: "no-store" };
  const query = { airtableRecId: id, select: "uid" };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?${new URLSearchParams(query)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) { return { error: { statusText: response?.statusText } }; }
  return result;
};


export const getTeam = async (id: string, options: string | string[][] | Record<string, string> | URLSearchParams | undefined) => {
  const requestOPtions: RequestInit = { method: "GET", headers: getHeader(""), cache: "no-store" };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/teams/${id}?${new URLSearchParams(options)}`, requestOPtions);
  const result = await response?.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formatedData = {
    id: result?.uid, name: result?.name, logo: result?.logo?.url, shortDescription: result?.shortDescription, website: result?.website, twitter: result?.twitterHandler,
    contactMethod: result?.contactMethod, linkedinHandle: result?.linkedinHandler, membershipSources: result?.membershipSources, longDescription: result?.longDescription,
    technologies: result?.technologies, industryTags: result?.industryTags, fundingStage: result?.fundingStage, role: result?.role,
    maintainingProjects: result?.maintainingProjects,
    contributingProjects: result?.contributingProjects
  };
  return { data: { formatedData } };
};


export const hasProjectEditAccess = (userInfo: IUserInfo, selectedProject: any, isUserLoggedIn: boolean, teams: any) => {
  try {
    if (!isUserLoggedIn) {
      return false;
    }

    if (userInfo?.roles && userInfo.roles.length && userInfo?.roles?.includes('DIRECTORYADMIN')) {
      return true;
    }


    if (selectedProject?.createdBy && userInfo?.uid === selectedProject?.createdBy) {
      return true;
    }

    if (teams) {
      if (teams?.some((team: any) => team?.id === selectedProject?.maintainingTeamUid)) {
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}