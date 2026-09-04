import { canPostTeamNews } from '@/components/page/team-details/TeamNews/canPostTeamNews';
import type { ITeam } from '@/types/teams.types';
import type { IUserInfo } from '@/types/shared.types';

const team = (status: ITeam['status'] = 'ACTIVE'): ITeam =>
  ({
    id: 'team-1',
    name: 'Acme',
    status,
  }) as ITeam;

const adminUser: IUserInfo = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as IUserInfo;

const memberUser: IUserInfo = { uid: 'member-1' } as IUserInfo;

describe('canPostTeamNews', () => {
  it('allows directory admins and team members on active teams', () => {
    expect(canPostTeamNews(team(), adminUser, false)).toBe(true);
    expect(canPostTeamNews(team(), memberUser, true)).toBe(true);
  });

  it('denies outsiders and inactive teams', () => {
    expect(canPostTeamNews(team(), memberUser, false)).toBe(false);
    expect(canPostTeamNews(team('INACTIVE'), adminUser, true)).toBe(false);
    expect(canPostTeamNews(team(), null, true)).toBe(false);
  });
});
