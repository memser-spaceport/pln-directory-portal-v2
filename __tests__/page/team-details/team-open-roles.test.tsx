import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const onJobClicked = jest.fn();
const onTeamDetailOpenRolesViewAllClicked = jest.fn();

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({ onJobClicked }),
}));

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({ onTeamDetailOpenRolesViewAllClicked }),
}));

// The real row drags in the refer modal, a member search and the whole jobs analytics
// stack. Stubbing it keeps this about the section's own job — which roles it shows, in
// what order, and what it tells the row about the surface.
type StubRowProps = {
  role: { uid: string };
  source: string;
  team?: { uid: string };
  currentUser?: { uid: string } | null;
  apply?: {
    memberUid: string | undefined;
    onApply: (target: unknown) => void;
    onViewJob?: (target: unknown) => void;
  };
  onClick?: () => void;
};

const rowProps: StubRowProps[] = [];
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: (props: StubRowProps) => {
    rowProps.push(props);
    /* Two buttons, because the row really does have two doors and only one of
       them is open at a time: `onClick` reaches the outbound anchor (flag off),
       `apply.onViewJob` the in-app title button (flag on). */
    return (
      <div data-testid="role-row" data-uid={props.role.uid} onClick={props.onClick}>
        {props.role.uid}
        {props.apply?.onViewJob && (
          <button type="button" data-testid={`view-job-${props.role.uid}`} onClick={() => props.apply?.onViewJob?.({})}>
            View job
          </button>
        )}
      </div>
    );
  },
}));

import { TeamOpenRoles } from '@/components/page/team-details/TeamOpenRoles';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';

const role = (uid: string, postedDate: string): IJobRole => ({
  uid,
  roleTitle: `Role ${uid}`,
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: 'https://example.com/apply',
  lastUpdated: postedDate,
  postedDate,
  detectionDate: null,
});

const groupOf = (roles: IJobRole[]): IJobTeamGroup => ({
  team: {
    uid: 'team-1',
    name: 'Acme',
    logoUrl: null,
    focusAreas: ['AI & Robotics'],
    subFocusAreas: [],
    jobReferEmail: null,
  },
  totalRoles: roles.length,
  roles,
});

// Deliberately not in date order — the section is expected to sort.
const FIVE_ROLES = [
  role('c', '2026-03-01T00:00:00.000Z'),
  role('a', '2026-05-01T00:00:00.000Z'),
  role('e', '2026-01-01T00:00:00.000Z'),
  role('b', '2026-04-01T00:00:00.000Z'),
  role('d', '2026-02-01T00:00:00.000Z'),
];

const uids = () => screen.getAllByTestId('role-row').map((el) => el.getAttribute('data-uid'));

const renderSection = (group: IJobTeamGroup, props: Partial<Parameters<typeof TeamOpenRoles>[0]> = {}) =>
  render(<TeamOpenRoles group={group} userInfo={undefined} {...props} />);

describe('TeamOpenRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rowProps.length = 0;
  });

  it('renders nothing when the team has no open roles', () => {
    const { container } = renderSection(groupOf([]));

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first two roles under a counted heading', () => {
    renderSection(groupOf(FIVE_ROLES));

    expect(screen.getByText('Open roles (5)')).toBeInTheDocument();
    expect(screen.getAllByTestId('role-row')).toHaveLength(2);
  });

  it('orders roles newest-first regardless of the order the API returned them in', () => {
    renderSection(groupOf(FIVE_ROLES));

    // 'a' is May, 'b' is April — the API's own order started with 'c'.
    expect(uids()).toEqual(['a', 'b']);
  });

  it('expands in place and collapses again', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES));

    const expander = screen.getByRole('button', { name: 'View all 5 roles' });
    expect(expander).toHaveAttribute('aria-expanded', 'false');

    await user.click(expander);

    expect(uids()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(onTeamDetailOpenRolesViewAllClicked).toHaveBeenCalledWith({
      teamUid: 'team-1',
      teamName: 'Acme',
      totalRoles: 5,
      expanded: true,
    });
    const collapser = screen.getByRole('button', { name: 'Show less' });
    expect(collapser).toHaveAttribute('aria-expanded', 'true');

    await user.click(collapser);

    expect(screen.getAllByTestId('role-row')).toHaveLength(2);
    expect(onTeamDetailOpenRolesViewAllClicked).toHaveBeenLastCalledWith({
      teamUid: 'team-1',
      teamName: 'Acme',
      totalRoles: 5,
      expanded: false,
    });
  });

  it('offers no expander when everything already fits', () => {
    renderSection(groupOf(FIVE_ROLES.slice(0, 2)));

    expect(screen.getByText('Open roles (2)')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the same roles in the heading as the expander reveals', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES));

    expect(screen.getByText('Open roles (5)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View all 5 roles' }));

    expect(screen.getAllByTestId('role-row')).toHaveLength(5);
  });

  it('tells each row it is on the team profile, not the board', () => {
    renderSection(groupOf(FIVE_ROLES));

    expect(rowProps).not.toHaveLength(0);
    expect(rowProps.every((p) => p.source === 'team-profile')).toBe(true);
    expect(rowProps.every((p) => p.team?.uid === 'team-1')).toBe(true);
  });

  it('attributes a role click to the team profile without a filter state', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES));

    await user.click(screen.getAllByTestId('role-row')[0]);

    expect(onJobClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: 'a',
        team_id: 'team-1',
        source: 'team-profile',
        position_in_list: 0,
        focus_areas: ['AI & Robotics'],
      }),
    );
    expect(onJobClicked.mock.calls[0][0]).not.toHaveProperty('filter_state');
  });

  it('passes the viewer down from props rather than reading the client store', () => {
    const userInfo = { uid: 'm1', name: 'Ada' } as unknown as IUserInfo;
    renderSection(groupOf(FIVE_ROLES), { userInfo });

    expect(rowProps.every((p) => p.currentUser === userInfo)).toBe(true);
  });

  it('hands a logged-out viewer null, not undefined, because that is the row prop', () => {
    renderSection(groupOf(FIVE_ROLES));

    expect(rowProps.every((p) => p.currentUser === null)).toBe(true);
  });
});

/**
 * Prop presence is the gate, exactly as on the board — no test here reads
 * `SHOW_JOB_BOARD_APPLY`, which `.env.local` sets true locally and CI leaves
 * blank. "Flag on" means the host passed `apply`; "flag off" means it didn't.
 */
describe('TeamOpenRoles with the in-app flow on', () => {
  const onApply = jest.fn();
  const onViewJob = jest.fn();
  const apply = { onApply, memberUid: 'm1', onViewJob };

  beforeEach(() => {
    jest.clearAllMocks();
    rowProps.length = 0;
  });

  it('gives every visible row the apply slot', () => {
    renderSection(groupOf(FIVE_ROLES), { apply });

    expect(rowProps).toHaveLength(2);
    expect(rowProps.every((p) => p.apply?.memberUid === 'm1')).toBe(true);
    expect(rowProps.every((p) => typeof p.apply?.onViewJob === 'function')).toBe(true);
  });

  it('gives newly expanded rows the slot too', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES), { apply });

    await user.click(screen.getByRole('button', { name: 'View all 5 roles' }));

    expect(screen.getAllByTestId('role-row')).toHaveLength(5);
    expect(rowProps.filter((p) => p.apply?.onViewJob)).toHaveLength(rowProps.length);
  });

  it('reports the open to both the funnel and the flow', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES), { apply });

    await user.click(screen.getByTestId('view-job-a'));

    // Without this, turning the flag on would delete this surface's only
    // denominator: `onClick` never fires once the title becomes a button.
    expect(onJobClicked).toHaveBeenCalledWith(
      expect.objectContaining({ job_id: 'a', position_in_list: 0, source: 'team-profile' }),
    );
    expect(onViewJob).toHaveBeenCalledTimes(1);
  });

  it('carries the row position of an expanded role, not its position on screen', async () => {
    const user = userEvent.setup();
    renderSection(groupOf(FIVE_ROLES), { apply });

    await user.click(screen.getByRole('button', { name: 'View all 5 roles' }));
    await user.click(screen.getByTestId('view-job-d'));

    // 'd' is February — fourth once sorted newest-first.
    expect(onJobClicked).toHaveBeenLastCalledWith(expect.objectContaining({ job_id: 'd', position_in_list: 3 }));
  });

  it('leaves the row untouched when the host passes no apply slot', () => {
    renderSection(groupOf(FIVE_ROLES));

    expect(rowProps.every((p) => p.apply === undefined)).toBe(true);
    expect(screen.queryByTestId('view-job-a')).not.toBeInTheDocument();
  });
});
