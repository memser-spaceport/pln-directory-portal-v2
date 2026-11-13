import type { IJobsListResponse } from '@/types/jobs.types';

/**
 * The board's page without the roles' descriptions (LAB-3254), for the server render of `/jobs`.
 *
 * The server page goes into the HTML as the client's placeholder data, and every role's full posting with it: 171
 * roles made a 1.58 MB page, 85% of it that payload, while Googlebot reads only the first 2 MB of a page. The cards
 * never show a description; the drawer does, and fetches it for a role marked `descriptionOmitted`. The client's own
 * fetch of page 1, right after hydration, brings the descriptions back for the list.
 */
export function omitRoleDescriptions(page: IJobsListResponse): IJobsListResponse {
  return {
    ...page,
    groups: page.groups.map((group) => ({
      ...group,
      roles: group.roles.map(({ descriptionHtml: _omitted, ...role }) => ({ ...role, descriptionOmitted: true })),
    })),
  };
}
