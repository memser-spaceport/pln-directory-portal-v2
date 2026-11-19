/**
 * LAB-3254: the board's server page drops every role's description, which was 85% of a 1.58 MB page, and marks the
 * role so the drawer knows to fetch it.
 */
import { omitRoleDescriptions } from '@/services/jobs/omitRoleDescriptions';
import type { IJobsListResponse } from '@/types/jobs.types';

const page = {
  groups: [
    {
      team: { uid: 't1', name: 'Team', logoUrl: null, focusAreas: [], subFocusAreas: [], jobReferEmail: null },
      roles: [
        { uid: 'r1', roleTitle: 'Engineer', descriptionHtml: '<p>A long posting</p>' },
        { uid: 'r2', roleTitle: 'Designer', descriptionHtml: null },
      ],
    },
  ],
  page: 1,
  limit: 20,
  total: 2,
  totalGroups: 1,
  totalRoles: 2,
} as unknown as IJobsListResponse;

describe('omitRoleDescriptions', () => {
  it('drops every description and marks the role, keeping everything else', () => {
    const result = omitRoleDescriptions(page);
    const roles = result.groups[0].roles;

    expect(JSON.stringify(result)).not.toContain('A long posting');
    expect(roles.map((role) => 'descriptionHtml' in role)).toEqual([false, false]);
    expect(roles.map((role) => role.descriptionOmitted)).toEqual([true, true]);
    expect(roles.map((role) => role.roleTitle)).toEqual(['Engineer', 'Designer']);
    expect(result.totalRoles).toBe(2);
  });

  it('leaves the page it was given alone', () => {
    omitRoleDescriptions(page);
    expect(page.groups[0].roles[0].descriptionHtml).toBe('<p>A long posting</p>');
  });
});
