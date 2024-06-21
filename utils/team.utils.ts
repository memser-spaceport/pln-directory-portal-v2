import { ITag, ITeamListOptions, ITeamResponse, ITeamsSearchParams } from "@/types/teams.types";
import { getSortFromQuery, getUniqueFilterValues, stringifyQueryValues } from "./common.utils";
import { URL_QUERY_VALUE_SEPARATOR } from "./constants";

export function getTeamsOptionsFromQuery(queryParams: ITeamsSearchParams) {
  const { sort, tags, membershipSources, fundingStage, searchBy, technology, includeFriends, focusAreas, officeHoursOnly } = queryParams;
  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase();

  return {
    ...(officeHoursOnly ? { officeHours__not: 'null' } : {}),
    ...(technology ? { "technologies.title__with": stringifyQueryValues(technology) } : {}),
    ...(membershipSources ? { "membershipSources.title__with": stringifyQueryValues(membershipSources) } : {}),
    ...(fundingStage ? { "fundingStage.title__with": stringifyQueryValues(fundingStage) } : {}),
    ...(tags ? { "industryTags.title__with": stringifyQueryValues(tags) } : {}),
    ...(includeFriends ? {} : { plnFriend: false }),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    ...(focusAreas ? { 'focusAreas': stringifyQueryValues(focusAreas) } : {}),
    orderBy: `${sortFromQuery.direction === "desc" ? "-" : ""}${sortField}`,
  };
}

export const parseTeamsFilters = (teams: ITeamResponse[]) => {
  const filtersValues = teams?.reduce(
    (values: { tags: string[], membershipSources: string[], fundingStage: string[], technology: string[] }, team: ITeamResponse) => {
      const tags = getUniqueFilterValues(
        values.tags,
        team.industryTags?.map((tag: ITag) => tag.title)
      );
      const membershipSources = getUniqueFilterValues(
        values.membershipSources,
        team.membershipSources?.map((source: ITag) => source.title)
      );
      const fundingStage = getUniqueFilterValues(values?.fundingStage, team?.fundingStage && [team?.fundingStage?.title]);
      const technology = getUniqueFilterValues(
        values.technology,
        team.technologies?.map((technology: { title: string }) => technology.title)
      );

      return { tags, membershipSources, fundingStage, technology };
    },
    {
      tags: [],
      membershipSources: [],
      fundingStage: [],
      technology: [],
    }
  );

  Object.values(filtersValues).forEach((value) => value.sort());
  return filtersValues;
};


export function getTagsFromValues(allValues: string[], availableValues: string[], queryValues: string | string[] = []) {
  const queryValuesArr = Array.isArray(queryValues) ? queryValues : queryValues.split(URL_QUERY_VALUE_SEPARATOR);
  return allValues.map((value) => {
    const selected = queryValuesArr.includes(value);
    const available = availableValues.includes(value);
    const disabled = !selected && !available;
    return { value, selected, disabled };
  });
}


export function getTeamsListOptions(options: ITeamListOptions) {
  return { ...options, select: "uid,name,shortDescription,logo.url,industryTags.title", pagination: true };
}