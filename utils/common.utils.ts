import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE, EMAIL_REGEX, EVENTS, GITHUB_URL_REGEX, LINKEDIN_URL_REGEX, SORT_OPTIONS, TELEGRAM_URL_REGEX, TWITTER_URL_REGEX } from './constants';
import { ITeam } from '@/types/teams.types';
import Cookies from 'js-cookie'
export const triggerLoader = (status: boolean) => {
  document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: status }));
};

export function compareObjsIfSame(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true; // Handles identical values and reference equality for objects and arrays
  }

   // Treat "" and null as equivalent
   if ((obj1 === "" && obj2 === null) || (obj1 === null && obj2 === "")) {
    return true;
  }

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false; // Handles primitive types and null
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false; // One is an array and the other is not
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      return false; // Different array lengths
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!compareObjsIfSame(obj1[i], obj2[i])) {
        return false; // Different array elements
      }
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false; // Different number of properties
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || !compareObjsIfSame(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
export const getUserInfoFromLocal = () => {
  try {
    const rawUserInfo = Cookies.get('userInfo');
    if (rawUserInfo) {
      return JSON.parse(rawUserInfo);
    }

    return null;
  } catch (error) {
    return null;
  }
};


export const getUniqueId = () => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  return dateString + randomness;
};

export const getParsedValue = (value: string | undefined) => {
  try {
    if (value) {
      return JSON.parse(value);
    }
    return '';
  } catch (error) {
    return '';
  }
};

export const getAnalyticsUserInfo = (userInfo: IUserInfo | null | undefined) => {
  if (userInfo?.name && userInfo?.email && userInfo?.roles) {
    return { name: userInfo?.name, email: userInfo?.email, roles: userInfo?.roles };
  }
  return null;
};

export const getAnalyticsNotificationInfo = (notification: any) => {
  return {
    type: notification?.type,
    status: notification?.status,
    interaction: notification?.interaction,
  };
};

export const getAnalyticsLocationInfo = (location: any) => {
  if (location) {
    return { locationUid: location?.uid, locationName: location?.name };
  }
  return {
    locationUid: '',
    locationName: '',
  };
};

export const getAnalyticsTeamInfo = (team: ITeam | undefined) => {
  if (team?.name && team?.shortDescription) {
    return { name: team?.name ?? '', shortDescription: team?.shortDescription ?? '' };
  }
  return null;
};

export const getAnalyticsMemberInfo = (member: any) => {
  if (member?.name) {
    return {
      id: member?.id,
      name: member?.name,
    };
  }

  return null;
};

export const getAnalyticsFocusAreaInfo = (focusArea: any) => {
  if (focusArea) {
    return {
      id: focusArea?.uid,
      title: focusArea?.title,
    };
  }
  return null;
};

export const getAnalyticsProjectInfo = (project: any) => {
  if (project?.name && project?.description) {
    return { id: project?.uid, name: project?.name ?? '', description: project?.description };
  }
  return null;
};


export const getQuery = (searchParams: any) => {
  return {
    tags: searchParams?.tags ?? '',
    membershipSources: searchParams?.membershipSources ?? '',
    fundingStage: searchParams?.fundingStage ?? '',
    technology: searchParams?.technology ?? '',
    includeFriends: searchParams?.includeFriends ?? '',
    includeUnVerified: searchParams?.includeUnVerified ?? '',
    isRecent: searchParams?.isRecent ?? '',
    openToWork: searchParams?.openToWork ?? '',
    officeHoursOnly: searchParams?.officeHoursOnly ?? '',
    skills: searchParams?.skills ?? '',
    region: searchParams?.region ?? '',
    country: searchParams?.country ?? '',
    metroArea: searchParams?.metroArea ?? '',
    focusAreas: searchParams?.focusAreas ?? '',
    memberRoles: searchParams?.memberRoles ?? '',
    funding: searchParams?.funding ?? '',
    team: searchParams?.team ?? '',
  };
};

export const getFilterCount = (filters: any) => {
  let count = 0;

  if (typeof filters === 'object') {
    Object.keys(filters).forEach((key) => {
      filters[key] !== '' ? (count += 1) : count;
    });
  }
  return count;
};

function isSortValid(sortQuery?: string) {
  const directorySortOptions = [SORT_OPTIONS.ASCENDING, SORT_OPTIONS.DESCENDING];
  return sortQuery && directorySortOptions.includes(sortQuery);
}

export function getSortFromQuery(sortQuery?: string) {
  const sort = isSortValid(sortQuery) ? sortQuery : 'Name,asc';
  const sortSettings = sort?.split(',') ?? '';
  return {
    field: sortSettings[0],
    direction: sortSettings[1],
  };
}

export function stringifyQueryValues(values: string | string[]) {
  return Array.isArray(values) ? values.toString() : values.replace(/\|/g, ',');
}

export const getUniqueFilterValues = (uniqueValues: string[], newValues?: string[]): string[] => {
  return [...new Set([...uniqueValues, ...(newValues || [])])];
};

export const getHeader = (authToken: string | undefined) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (authToken) {
    headers.append('Authorization', `Bearer ${authToken}`);
  }
  return headers;
};

export const calculateTotalPages = (totalItems: number, itemsPerPage: number) => {
  return Math.ceil(totalItems / itemsPerPage);
};

export const validateEmail = (email: string) => {
  return EMAIL_REGEX?.test(email) ? true : false;
};

export function getSocialLinkUrl(linkContent: string, type: string, url?: string) {
  const socialUrls: any = {
    email: `mailto:${linkContent}`,
    twitter: `https://twitter.com/${linkContent}`,
    github: `https://github.com/${linkContent}`,
    telegram: `https://t.me/${linkContent}`,
    linkedin: type === 'linkedin' && linkContent !== url ? url : `https://www.linkedin.com/search/results/all/?keywords=${linkContent}`,
    discord: 'https://discord.com/app',
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

  return match && match[1] ? decodeURIComponent(match[1]).replace(/^@/, '') : type === 'telegram' || type === 'twitter' ? handle?.replace(/^@/, '') : handle;
};

export const sortMemberByRole = (firstMember: { teamLead: number; name: string }, secondMember: { teamLead: number; name: any }) => {
  if (secondMember.teamLead - firstMember.teamLead !== 0) {
    return secondMember.teamLead - firstMember.teamLead;
  }
  return firstMember.name.localeCompare(secondMember.name);
};

export const hasProjectEditAccess = (userInfo: IUserInfo, selectedProject: any, isUserLoggedIn: boolean, teams: any) => {
  try {
    if (!isUserLoggedIn) {
      return false;
    }

    if (userInfo?.roles && userInfo.roles.length && userInfo?.roles?.includes(ADMIN_ROLE)) {
      return true;
    }

    if (selectedProject?.createdBy && userInfo?.uid === selectedProject?.createdBy) {
      return true;
    }

    if (teams?.length > 0) {
      for (const team of teams) {
        if (team.id === selectedProject.teamUid) {
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const hasProjectDeleteAccess = (userInfo: any, project: any, isUserLoggedIn: any) => {
  if (!isUserLoggedIn) {
    return false;
  }

  if (userInfo?.roles?.length && userInfo.roles.includes(ADMIN_ROLE)) {
    return true;
  }

  if (userInfo?.leadingTeams?.length && userInfo.leadingTeams.includes(project?.teamUid)) {
    return true;
  }

  return false;
};

export const calculateTime = (inputDate: any) => {
  const currentDate = new Date() as any;
  const inputDateTime = new Date(inputDate) as any;

  const timeDifference = currentDate - inputDateTime;

  const daysDifference = Math.round(timeDifference / (24 * 60 * 60 * 1000));

  const formatTime = (date: any) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  if (daysDifference < 0) {
    return `0 day ago`;
  }

  if (daysDifference === 0) {
    return 'Today ' + formatTime(inputDateTime);
  } else if (daysDifference === 1) {
    return 'Yesterday ' + formatTime(inputDateTime);
  } else if (daysDifference <= 7) {
    return daysDifference + ' day' + (daysDifference > 1 ? 's' : '') + ' ago';
  } else {
    const weeksDifference = Math.floor(daysDifference / 7);
    if (weeksDifference <= 4) {
      return weeksDifference + ' week' + (weeksDifference > 1 ? 's' : '') + ' ago';
    } else {
      const monthsDifference = Math.floor(daysDifference / 30);
      if (monthsDifference <= 12) {
        return monthsDifference + ' month' + (monthsDifference > 1 ? 's' : '') + ' ago';
      } else {
        const yearsDifference = Math.floor(monthsDifference / 12);
        return yearsDifference + ' year' + (yearsDifference > 1 ? 's' : '') + ' ago';
      }
    }
  }
};


export function removeAtSymbol(str: string) {
  try {
    if (str.startsWith('@')) {
      return str.slice(1);
    }
    return str;
  } catch (error) {
    return str
  }
}

export function getTelegramUsername(input: string) {
  const regex = /(?:https?:\/\/)?(?:www\.)?t(?:elegram)?\.me\/([a-zA-Z0-9_]+)/;
  const match = input?.match(regex);
  return match ? match[1] : input;
}
