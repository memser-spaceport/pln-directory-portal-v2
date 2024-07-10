import { getSortFromQuery, stringifyQueryValues } from './common.utils';

export const getProjectsFiltersFromQuery = (queryParams: any) => {
  const { sort, funding, team, searchBy } = queryParams;
  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase();

  return {
    ...(funding ? { lookingForFunding: funding } : {}),
    ...(team ? { maintainingTeamUid: team } : {}),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    orderBy: `${sortFromQuery.direction === 'desc' ? '-' : ''}${sortField}`,
  };
};

export function getProjectSelectOptions(options: any) {
  return { ...options, pagination: false };
}
