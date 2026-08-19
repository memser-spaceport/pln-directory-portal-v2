import type { IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

type JobsListResult = { data: IJobsListResponse } | { isError: true } | null | undefined;

/**
 * Narrows the jobs-list response to this team's group, or nothing.
 *
 * The team check is not defensive padding. `JobsListQueryParams` is a non-strict Zod
 * object, so an API build that predates the `teamUid` param **ignores it silently** and
 * answers with the newest team's group instead of erroring — which would render another
 * company's postings under this team's name. That failure looks like real content, so it
 * has to be caught here rather than noticed in review.
 *
 * Also collapses "no roles" to null, so callers gate the whole section on one value.
 */
export function selectTeamOpenRoles(response: JobsListResult, teamUid: string): IJobTeamGroup | null {
  if (!response || !('data' in response)) return null;

  const group = response.data.groups?.[0];
  if (!group || group.team.uid !== teamUid) return null;

  return group.roles?.length ? group : null;
}
