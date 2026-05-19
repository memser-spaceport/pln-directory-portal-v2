export enum JobsQueryKey {
  List = 'jobs-list',
  Filters = 'jobs-filters',
  BaseFilters = 'jobs-base-filters',
}

export const JOBS_SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'newest', label: 'Newest' },
] as const;
