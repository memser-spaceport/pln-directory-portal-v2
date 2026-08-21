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

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => null,
}));

// The real row drags in the refer modal, a member search and the whole jobs analytics
// stack. Stubbing it keeps this about the section's own job — which roles it shows, in
// what order, and what it tells the row about the surface.
const rowProps: { role: { uid: string }; source: string }[] = [];
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: (props: { role: { uid: string }; source: string; onClick?: () => void }) => {
    rowProps.push({ role: props.role, source: props.source });
    return (
      <div data-testid="role-row" data-uid={props.role.uid} onClick={props.onClick}>
        {props.role.uid}
      </div>
    );
  },
}));

import { TeamOpenRoles } from '@/components/page/team-details/TeamOpenRoles';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

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
  team: { uid: 'team-1', name: 'Acme', logoUrl: null, focusAreas: ['AI & Robotics'], subFocusAreas: [] },
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

describe('TeamOpenRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rowProps.length = 0;
  });

  it('renders nothing when the team has no open roles', () => {
    const { container } = render(<TeamOpenRoles group={groupOf([])} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first two roles under a counted heading', () => {
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

    expect(screen.getByText('Open roles (5)')).toBeInTheDocument();
    expect(screen.getAllByTestId('role-row')).toHaveLength(2);
  });

  it('orders roles newest-first regardless of the order the API returned them in', () => {
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

    // 'a' is May, 'b' is April — the API's own order started with 'c'.
    expect(uids()).toEqual(['a', 'b']);
  });

  it('expands in place and collapses again', async () => {
    const user = userEvent.setup();
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

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
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES.slice(0, 2))} />);

    expect(screen.getByText('Open roles (2)')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the same roles in the heading as the expander reveals', async () => {
    const user = userEvent.setup();
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

    expect(screen.getByText('Open roles (5)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View all 5 roles' }));

    expect(screen.getAllByTestId('role-row')).toHaveLength(5);
  });

  it('tells each row it is on the team profile, not the board', () => {
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

    expect(rowProps).not.toHaveLength(0);
    expect(rowProps.every((p) => p.source === 'team-profile')).toBe(true);
  });

  it('attributes a role click to the team profile without a filter state', async () => {
    const user = userEvent.setup();
    render(<TeamOpenRoles group={groupOf(FIVE_ROLES)} />);

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
});
