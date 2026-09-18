import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The applicants count line on a team profile, with the flag ON.
 *
 * Its own file because `SHOW_TEAM_APPLICANTS` is pinned per module, and the
 * sibling `team-open-roles-section` suite pins it OFF — which is the state every
 * environment is in today, and the reason a Protocol Labs case added there would
 * pass without testing anything: with the flag down no line renders for anybody.
 *
 * What is pinned here is the pair. That a lead of an ordinary team gets the line
 * AND the counts query, and that a lead of Protocol Labs gets neither — PL
 * hiring lives in PL's own ATS, so this surface would be a second inbox nobody
 * empties.
 */

jest.mock('@/services/jobs/constants', () => ({
  ...jest.requireActual('@/services/jobs/constants'),
  SHOW_JOB_BOARD_APPLY: true,
  SHOW_TEAM_APPLICANTS: true,
}));

jest.mock('@/components/page/jobs/hooks/useJobApplySurface', () => ({
  useJobApplySurface: () => ({ viewer: {}, flow: {}, applyProps: undefined, controller: null }),
}));

jest.mock('@/components/page/team-details/TeamOpenRoles/TeamOpenRoles', () => ({
  TeamOpenRoles: (props: { renderRoleFooter?: (uid: string) => React.ReactNode }) => (
    <div data-testid="roles-list">{props.renderRoleFooter?.('role-1')}</div>
  ),
}));

/* Captured rather than run: what matters is whether the host asks for
   privileged counts at all. Every applicants read is authenticated, and
   `customFetch` answers a missing session by logging out and reloading — so an
   ungated one on a public team profile is a reload loop. */
const countsCalls: { enabled: boolean; teamUid: string }[] = [];
jest.mock('@/services/jobs/hooks/useTeamApplicants', () => ({
  useApplicantCounts: (args: { enabled: boolean; teamUid: string }) => {
    countsCalls.push(args);
    return { data: [{ roleUid: 'role-1', applicantCount: 2, interestCount: 1, newCount: 2, newestAvatars: [] }] };
  },
}));

import { TeamOpenRolesSection } from '@/components/page/team-details/TeamOpenRoles/TeamOpenRolesSection';
import type { IJobTeamGroup } from '@/types/jobs.types';

const PL_UID = 'cldvnyxaf01ynu21k62uopjvg';

const group = (team: { uid: string; name: string }) =>
  ({
    team: { ...team, logoUrl: null, focusAreas: [], subFocusAreas: [], jobReferEmail: null },
    totalRoles: 1,
    roles: [
      {
        uid: 'role-1',
        roleTitle: 'Engineer',
        roleCategory: null,
        seniority: null,
        location: [],
        workMode: null,
        applyUrl: null,
        lastUpdated: '2026-05-01T00:00:00.000Z',
        postedDate: '2026-05-01T00:00:00.000Z',
        detectionDate: null,
      },
    ],
  }) as IJobTeamGroup;

const leadOf = (uid: string) => ({ uid: 'u1', leadingTeams: [uid] }) as never;
const lastCounts = () => countsCalls[countsCalls.length - 1];

beforeEach(() => {
  countsCalls.length = 0;
});

describe('the applicants count line', () => {
  it('shows for a lead of an ordinary team, and asks for that team’s counts', () => {
    render(
      <TeamOpenRolesSection group={group({ uid: 'team-1', name: 'Acme' })} isLoggedIn userInfo={leadOf('team-1')} />,
    );

    expect(lastCounts().enabled).toBe(true);
    expect(lastCounts().teamUid).toBe('team-1');
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('stays away from a member of that team', () => {
    render(
      <TeamOpenRolesSection group={group({ uid: 'team-1', name: 'Acme' })} isLoggedIn userInfo={leadOf('team-9')} />,
    );

    expect(lastCounts().enabled).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('stays away from Protocol Labs, for its own lead', () => {
    render(
      <TeamOpenRolesSection
        group={group({ uid: PL_UID, name: 'Protocol Labs' })}
        isLoggedIn
        userInfo={leadOf(PL_UID)}
      />,
    );

    expect(lastCounts().enabled).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  /* Outside production PL's uid is a different seed, so the name is the only
     thing identifying it — the environment this is clicked around in most. */
  it('stays away from a PL team seeded under another uid', () => {
    render(
      <TeamOpenRolesSection
        group={group({ uid: 'pl-uat-seed', name: 'Protocol Labs' })}
        isLoggedIn
        userInfo={leadOf('pl-uat-seed')}
      />,
    );

    expect(lastCounts().enabled).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
