import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockCount = jest.fn<number | undefined, []>(() => undefined);

// See team-news-count-chip.test.tsx: the global useQuery stub ignores `select`.
jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({
  useTeamNewsCount: () => mockCount(),
}));

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onTeamNewsCountChipClicked: jest.fn() }),
}));

jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({
  useGetFocusTags: () => [],
}));

// The role rows pull in the refer modal, a member search and the jobs analytics
// stack — none of which this card's news chip touches.
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: () => <li data-testid="role-row" />,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => null,
}));

import { TeamGroupCard } from '@/components/page/jobs/TeamGroupCard';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

const role = (uid: string): IJobRole => ({
  uid,
  roleTitle: 'Engineer',
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  // Old enough that isNew() is false, so the green "+N new" roles badge stays
  // out of the way of the assertions below.
  lastUpdated: '2020-01-01T00:00:00.000Z',
  postedDate: '2020-01-01T00:00:00.000Z',
  detectionDate: null,
});

const group: IJobTeamGroup = {
  team: { uid: 'team-1', name: 'Acme', logoUrl: null, focusAreas: [], subFocusAreas: [] },
  totalRoles: 1,
  roles: [role('role-1')],
};

describe('TeamGroupCard news chip', () => {
  const onOpenTeamNews = jest.fn();
  const onRoleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCount.mockReturnValue(3);
  });

  it('shows the chip on the team name row', () => {
    render(<TeamGroupCard group={group} onRoleClick={onRoleClick} onOpenTeamNews={onOpenTeamNews} />);
    expect(screen.getByRole('button', { name: /3 new posts/i })).toBeInTheDocument();
  });

  it('shows no chip when the board has not wired one up', () => {
    render(<TeamGroupCard group={group} onRoleClick={onRoleClick} />);
    expect(screen.queryByRole('button', { name: /new posts?/i })).not.toBeInTheDocument();
  });

  it('hands over team.uid — the job board names the identifier differently', async () => {
    render(<TeamGroupCard group={group} onRoleClick={onRoleClick} onOpenTeamNews={onOpenTeamNews} />);

    await userEvent.click(screen.getByRole('button', { name: /3 new posts/i }));

    // `group.team.uid` here vs `team.id` on the teams grid — same backend value,
    // different field on each surface's view model.
    expect(onOpenTeamNews).toHaveBeenCalledWith('team-1', 'Acme');
  });

  it('leaves the open-roles count alone', () => {
    render(<TeamGroupCard group={group} onRoleClick={onRoleClick} onOpenTeamNews={onOpenTeamNews} />);

    // The two counts on this card mean different things and must not be
    // conflated: "1 open role" counts jobs, "3 new posts" counts news.
    expect(screen.getByText('open role')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
