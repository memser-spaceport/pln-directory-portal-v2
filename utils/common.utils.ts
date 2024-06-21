import { IUserInfo } from "@/types/shared.types";
import { EVENTS, SORT_OPTIONS } from "./constants";

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

export const getAnalyticsUserInfo = (userInfo: IUserInfo | null) => {
  if (userInfo?.name && userInfo?.email && userInfo?.roles) {
    return { name: userInfo?.name, email: userInfo?.email, roles: userInfo?.roles };
  }
  return null;
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


export const  getFilterCount = (filters:any) => {
  let count = 0;

  if(typeof filters === "object") {
    Object.keys(filters).forEach((key) => {
      filters[key]!== "" ? count += 1 : count
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