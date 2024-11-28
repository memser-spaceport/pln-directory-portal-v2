import { getSortFromQuery, stringifyQueryValues } from './common.utils';

export const getProjectsFiltersFromQuery = (queryParams: any) => {
  const { sort, funding, team, searchBy, focusAreas, isRecent } = queryParams;
  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase();

  return {
    ...(funding ? { lookingForFunding: funding } : {}),
    ...(team ? { maintainingTeamUid: team } : {}),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    ...(focusAreas ? { focusAreas: stringifyQueryValues(focusAreas) } : {}),
    ...(isRecent ? { isRecent: true } : {}),
    orderBy: sort ? `${sortFromQuery.direction === 'desc' ? '-' : ''}${sortField}` : 'score,name',
  };
};

export function getProjectSelectOptions(options: any) {
  return { ...options, pagination: true};
}

export const SORT_OPTIONS = {
  ASCENDING: 'Name,asc',
  DESCENDING: 'Name,desc',
  DEFAULT: 'Score,asc',
};

export const PROJECT_SORT_ICONS = [
  {
    name: 'Name,asc',
    label: 'Ascending',
    selectedIcon: '/icons/ascending-selected.svg',
    deselectIcon: '/icons/ascending-black.svg',
    normalIcon: '/icons/ascending-gray.svg',
  },
  {
    name: 'Name,desc',
    label: 'Descending',
    selectedIcon: '/icons/descending-selected.svg',
    deselectIcon: '/icons/descending-black.svg',
    normalIcon: '/icons/ascending-gray.svg',
  },
  { name: 'Score,asc', label: 'Default', deselectIcon: '/icons/star-outline-black.svg', selectedIcon: '/icons/star-outline-white.svg', normalIcon: '/icons/star-outline-gray.svg' },
];
