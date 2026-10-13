import { JobsQueryKey } from '@/services/jobs/constants';

export function isSavedScopeBoardQuery(queryKey: readonly unknown[]): boolean {
  const [name, params] = queryKey as [JobsQueryKey, string | undefined];
  const isBoardQuery = name === JobsQueryKey.List || name === JobsQueryKey.Filters;

  return isBoardQuery && new URLSearchParams(params).get('saved') === 'true';
}
