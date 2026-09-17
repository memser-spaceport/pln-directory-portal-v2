import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The flag is pinned here rather than read. `.env.local` sets
 * `NEXT_PUBLIC_SHOW_JOB_BOARD_APPLY=true` and next/jest loads it, so a test that
 * depended on the ambient value would pass locally and flip in CI, where the
 * variable is blank. Pinning it makes these assertions about the host's own
 * rule — `flag && (has roles || a sign-up is coming back)` — whose left-hand
 * side is a plain `&&` and needs no coverage.
 */
jest.mock('@/services/jobs/constants', () => ({
  ...jest.requireActual('@/services/jobs/constants'),
  SHOW_JOB_BOARD_APPLY: true,
}));

type SurfaceArgs = {
  enabled: boolean;
  source: string;
  deepLink: boolean;
  isLoading: boolean;
  groups: { team: { uid: string } }[];
  isLoggedIn: boolean;
};

const surfaceCalls: SurfaceArgs[] = [];
const applyProps = { onApply: jest.fn(), memberUid: 'm1', onViewJob: jest.fn() };

jest.mock('@/components/page/jobs/hooks/useJobApplySurface', () => ({
  useJobApplySurface: (args: SurfaceArgs) => {
    surfaceCalls.push(args);
    return {
      viewer: {},
      flow: {},
      applyProps: args.enabled ? applyProps : undefined,
      controller: args.enabled ? <div data-testid="controller" /> : null,
    };
  },
}));

jest.mock('@/components/page/team-details/TeamOpenRoles/TeamOpenRoles', () => ({
  TeamOpenRoles: (props: { group: { team: { uid: string } }; apply?: unknown; renderRoleFooter?: unknown }) => (
    <div
      data-testid="roles-list"
      data-team={props.group.team.uid}
      data-has-apply={String(Boolean(props.apply))}
      data-has-footer={String(Boolean(props.renderRoleFooter))}
    />
  ),
}));

/* The applicants count line rides on this host. Its query is captured rather
   than run: what matters here is whether the host asks for privileged counts at
   all, because every applicants read is authenticated and an ungated one on a
   public team profile makes customFetch reload the page forever. */
const countsCalls: { enabled: boolean; teamUid: string }[] = [];
jest.mock('@/services/jobs/hooks/useTeamApplicants', () => ({
  useApplicantCounts: (args: { enabled: boolean; teamUid: string }) => {
    countsCalls.push(args);
    return { data: undefined };
  },
}));

import { TeamOpenRolesSection } from '@/components/page/team-details/TeamOpenRoles/TeamOpenRolesSection';
import type { IJobTeamGroup } from '@/types/jobs.types';

const GROUP = {
  team: {
    uid: 'team-1',
    name: 'Acme',
    logoUrl: null,
    focusAreas: [],
    subFocusAreas: [],
    jobReferEmail: null,
  },
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
} as IJobTeamGroup;

const lastCall = () => surfaceCalls[surfaceCalls.length - 1];

beforeEach(() => {
  surfaceCalls.length = 0;
  countsCalls.length = 0;
});

const lastCounts = () => countsCalls[countsCalls.length - 1];

describe('TeamOpenRolesSection', () => {
  it('renders the list and the drawer stack when the team is hiring', () => {
    render(<TeamOpenRolesSection group={GROUP} isLoggedIn userInfo={undefined} />);

    expect(screen.getByTestId('roles-list')).toHaveAttribute('data-team', 'team-1');
    expect(screen.getByTestId('controller')).toBeInTheDocument();
    expect(screen.getByTestId('roles-list')).toHaveAttribute('data-has-apply', 'true');
  });

  it('renders no list when the team is not hiring — absent, not empty', () => {
    render(<TeamOpenRolesSection group={null} isLoggedIn userInfo={undefined} />);

    expect(screen.queryByTestId('roles-list')).not.toBeInTheDocument();
  });

  /**
   * The reason this host exists. Step 2 of the drawer composes the real
   * member-profile sections, and their edit forms call `router.refresh()` — on
   * `/teams/[id]` that re-runs the page's server fetch, jobs call included. If
   * the freshly fetched response no longer carries this team's roles, the list
   * goes; the application in flight must not go with it.
   */
  it('keeps the drawer stack mounted when the roles vanish underneath it', () => {
    const { rerender } = render(<TeamOpenRolesSection group={GROUP} isLoggedIn userInfo={undefined} />);
    expect(screen.getByTestId('controller')).toBeInTheDocument();

    rerender(<TeamOpenRolesSection group={null} isLoggedIn userInfo={undefined} />);

    expect(screen.queryByTestId('roles-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('controller')).toBeInTheDocument();
  });

  /* The applicants flag is off in this suite (only SHOW_JOB_BOARD_APPLY is
     pinned on), which is the state every environment is in today. */
  it('asks for no applicant counts, and offers no count line, while the flag is off', () => {
    render(<TeamOpenRolesSection group={GROUP} isLoggedIn userInfo={{ uid: 'u1', leadingTeams: ['team-1'] } as any} />);

    expect(lastCounts().enabled).toBe(false);
    expect(screen.getByTestId('roles-list')).toHaveAttribute('data-has-footer', 'false');
  });

  it('asks for no applicant counts for a signed-out visitor', () => {
    render(<TeamOpenRolesSection group={GROUP} isLoggedIn={false} userInfo={undefined} />);

    expect(lastCounts().enabled).toBe(false);
    expect(screen.getByTestId('roles-list')).toHaveAttribute('data-has-footer', 'false');
  });

  it('never writes ?job= on a team profile, and says which surface it is', () => {
    render(<TeamOpenRolesSection group={GROUP} isLoggedIn userInfo={undefined} />);

    expect(lastCall().deepLink).toBe(false);
    expect(lastCall().source).toBe('team-profile');
    // Server-rendered — the roles arrive with the page, so nothing is pending.
    expect(lastCall().isLoading).toBe(false);
  });

  /**
   * Narrowing `enabled` to "teams that have roles" was tried and reverted. It
   * switches the flow off at exactly the moment `group` goes null — the moment
   * this host was hoisted above the gate to survive — and it strands a returning
   * sign-up on a team whose last role closed, since the resume that strips
   * `?applyTo=` would never run.
   */
  it('enables the flow on a team with no roles, so a returning sign-up can still land', () => {
    render(<TeamOpenRolesSection group={null} isLoggedIn userInfo={undefined} />);

    expect(lastCall().enabled).toBe(true);
    expect(screen.getByTestId('controller')).toBeInTheDocument();
  });

  it('hands the resume a role-less team as an empty list rather than nothing', () => {
    render(<TeamOpenRolesSection group={null} isLoggedIn userInfo={undefined} />);

    expect(lastCall().groups).toEqual([]);
  });

  it('resolves a pending uid against this team, and only this team', () => {
    render(<TeamOpenRolesSection group={GROUP} isLoggedIn userInfo={undefined} />);

    expect(lastCall().groups).toHaveLength(1);
    expect(lastCall().groups[0].team.uid).toBe('team-1');
  });
});
