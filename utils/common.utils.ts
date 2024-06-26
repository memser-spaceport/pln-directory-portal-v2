import { IUserInfo } from "@/types/shared.types";
import { EMAIL_REGEX, EVENTS, GITHUB_URL_REGEX, LINKEDIN_URL_REGEX, SORT_OPTIONS, TELEGRAM_URL_REGEX, TWITTER_URL_REGEX } from "./constants";
import { ITeam } from "@/types/teams.types";

export const triggerLoader = (status: boolean) => {
  document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: status }));
};

export const getParsedValue = (value: string) => {
  try {
    if (value) {
      return JSON.parse(value);
    }
    return "";
  } catch (error) {
    return "";
  }
};

export const getAnalyticsUserInfo = (userInfo: IUserInfo | null | undefined) => {
  if (userInfo?.name && userInfo?.email && userInfo?.roles) {
    return { name: userInfo?.name, email: userInfo?.email, roles: userInfo?.roles };
  }
  return null;
}

export const getAnalyticsTeamInfo = (team: ITeam | undefined) => {
  if (team?.name && team?.shortDescription ) {
    return { name: team?.name ?? "", shortDescription: team?.shortDescription ?? ""}
  }
  return null;
}

export const getAnalyticsMemberInfo = (member: any) => {
  if(member?.name) {
    return {
      name: member?.name,
    }
  }

  return null;
}

export const getAnalyticsProjectInfo = (project: any) => {
  if(project?.name && project?.description) {
    return { name: project?.name ?? "", description: project?.description}
  }
  return null
}
export const getQuery = (searchParams: any) => {
  return {
    tags: searchParams?.tags ?? "",
    membershipSources: searchParams?.membershipSources ?? "",
    fundingStage: searchParams?.fundingStage ?? "",
    technology: searchParams?.technology ?? "",
    includeFriends: searchParams?.includeFriends ?? "",
    openToWork: searchParams?.openToWork ?? "",
    officeHoursOnly: searchParams?.officeHoursOnly ?? "",
    skills: searchParams?.skills ?? "",
    region: searchParams?.region ?? "",
    country: searchParams?.country ?? "",
    metroArea: searchParams?.metroArea ?? "",
    focusAreas: searchParams?.focusAreas ?? "",
  };
}


export const getFilterCount = (filters: any) => {
  let count = 0;

  if (typeof filters === "object") {
    Object.keys(filters).forEach((key) => {
      filters[key] !== "" ? count += 1 : count
    })
  }
  return count;
};

function isSortValid(sortQuery?: string) {
  const directorySortOptions = [SORT_OPTIONS.ASCENDING, SORT_OPTIONS.DESCENDING];
  return sortQuery && directorySortOptions.includes(sortQuery);
}

export function getSortFromQuery(sortQuery?: string) {
  const sort = isSortValid(sortQuery) ? sortQuery : "Name,asc";
  const sortSettings = sort?.split(",") ?? "";
  return {
    field: sortSettings[0],
    direction: sortSettings[1],
  };
}

export function stringifyQueryValues(values: string | string[]) {
  return Array.isArray(values) ? values.toString() : values.replace(/\|/g, ",");
}

export const getUniqueFilterValues = (uniqueValues: string[], newValues?: string[]): string[] => {
  return [...new Set([...uniqueValues, ...(newValues || [])])];
};

export const getHeader = (authToken: string) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (authToken) {
    headers.append("Authorization", `Bearer ${authToken}`);
  }
  return headers;
};

export const calculateTotalPages = (totalItems: number, itemsPerPage: number) => {
  return Math.ceil(totalItems / itemsPerPage);
}

export const validateEmail = (email: string) => {
  return EMAIL_REGEX?.test(email) ? true : false
 };

 export function getSocialLinkUrl(linkContent: string, type: string, url?: string) {
  const socialUrls:any = {
    email: `mailto:${linkContent}`,
    twitter: `https://twitter.com/${linkContent}`,
    github: `https://github.com/${linkContent}`,
    telegram: `https://t.me/${linkContent}`,
    linkedin: type === "linkedin" && linkContent !== url
      ? url
      : `https://www.linkedin.com/search/results/all/?keywords=${linkContent}`,
    discord: "https://discord.com/app",
  };
  return socialUrls[type] || linkContent;
}

export const getProfileFromURL = (handle: string, type: string) => {
  const urlRegexMap: any = {
    linkedin: LINKEDIN_URL_REGEX,
    twitter: TWITTER_URL_REGEX,
    telegram: TELEGRAM_URL_REGEX,
    github: GITHUB_URL_REGEX,
  };

  const regex = urlRegexMap[type];
  
  const match = regex && handle?.match(regex);
  
  return (match && match[1]) ? decodeURIComponent(match[1]).replace(/^@/, "") :
    (type === "telegram" || type === "twitter") ? handle?.replace(/^@/, "") : handle;
};


export const sortMemberByRole = (firstMember: { teamLead: number; name: string; }, secondMember: { teamLead: number; name: any; }) => {
  if (secondMember.teamLead - firstMember.teamLead !== 0) {
    return secondMember.teamLead - firstMember.teamLead;
  }
  return firstMember.name.localeCompare(secondMember.name);
}