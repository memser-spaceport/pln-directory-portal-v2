import { toDirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/utils/toDirectoryMember';

const teamUid = 'hiring-team';

const member = (
  roles: Array<{ teamLead?: boolean; mainTeam?: boolean; role?: string; team?: { uid: string; name: string } }>,
) => ({
  uid: 'm1',
  name: 'Ada Lovelace',
  logo: 'https://example.com/ada.png',
  teamMemberRoles: roles,
});

describe('toDirectoryMember', () => {
  it('prefers the hiring team’s role over the main-team role', () => {
    const result = toDirectoryMember(
      member([
        { mainTeam: true, role: 'Advisor', team: { uid: 'other', name: 'Other Co' } },
        { teamLead: true, role: 'Staff Engineer', team: { uid: teamUid, name: 'Acme' } },
      ]),
      teamUid,
    );

    expect(result).toMatchObject({
      title: 'Staff Engineer',
      team: 'Acme',
      isTeamLead: true,
    });
  });

  it('falls back to the main-team role when they have none on the hiring team', () => {
    const result = toDirectoryMember(
      member([{ mainTeam: true, role: 'Advisor', team: { uid: 'other', name: 'Other Co' } }]),
      teamUid,
    );

    expect(result).toMatchObject({ title: 'Advisor', team: 'Other Co', isTeamLead: false });
  });

  it('does not treat a lead of another team as a hiring-team lead', () => {
    const result = toDirectoryMember(
      member([{ teamLead: true, mainTeam: true, role: 'CEO', team: { uid: 'other', name: 'Other Co' } }]),
      teamUid,
    );

    expect(result.isTeamLead).toBe(false);
  });
});
