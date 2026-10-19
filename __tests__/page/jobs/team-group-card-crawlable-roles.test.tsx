import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({ useTeamNewsCount: () => undefined }));
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({ onTeamNewsCountChipClicked: jest.fn(), onTeamNewsCountChipShown: jest.fn() }),
}));
jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({ useGetFocusTags: () => [] }));
// The real row pulls in the refer modal and the jobs analytics stack; what matters here is which roles get a row.
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: ({ role }: { role: { uid: string } }) => <li data-testid="role-row">{role.uid}</li>,
}));
jest.mock('@/services/auth/store', () => ({ useCurrentUserStore: () => null }));

import { TeamGroupCard } from '@/components/page/jobs/TeamGroupCard';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

const role = (n: number): IJobRole => ({
  uid: `role-${n}`,
  roleTitle: `Engineer ${n}`,
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2020-01-01T00:00:00.000Z',
  postedDate: '2020-01-01T00:00:00.000Z',
  detectionDate: null,
});

const group = (count: number): IJobTeamGroup => ({
  team: { uid: 'team-1', name: 'Acme', logoUrl: null, focusAreas: [], subFocusAreas: [], jobReferEmail: null },
  totalRoles: count,
  roles: Array.from({ length: count }, (_, i) => role(i + 1)),
});

/* LAB-2888: the roles behind "View all" are still links in the HTML, so a crawler reaches every role page. */
describe('TeamGroupCard: every role is a link in the HTML', () => {
  it('keeps the roles past the first three as hidden permalinks, not visible rows', () => {
    render(<TeamGroupCard group={group(5)} onRoleClick={jest.fn()} />);

    expect(screen.getAllByTestId('role-row').map((row) => row.textContent)).toEqual(['role-1', 'role-2', 'role-3']);
    const hidden = screen.getByTestId('collapsed-role-links');
    expect(hidden).not.toBeVisible();
    expect(
      within(hidden)
        .getAllByRole('link', { hidden: true })
        .map((a) => [a.getAttribute('href'), a.textContent]),
    ).toEqual([
      ['/jobs/openings/role-4', 'Engineer 4'],
      ['/jobs/openings/role-5', 'Engineer 5'],
    ]);
    // Out of the accessibility tree: no invisible tab stops or duplicate reading.
    expect(screen.queryAllByRole('link', { name: /Engineer 4/ })).toHaveLength(0);
  });

  it('drops the hidden links once expanded, when the real rows are there', async () => {
    render(<TeamGroupCard group={group(5)} onRoleClick={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'View all 5 roles at Acme' }));

    expect(screen.getAllByTestId('role-row')).toHaveLength(5);
    expect(screen.queryByTestId('collapsed-role-links')).not.toBeInTheDocument();
  });

  it('adds no hidden list when every role already has a row', () => {
    render(<TeamGroupCard group={group(3)} onRoleClick={jest.fn()} />);

    expect(screen.queryByTestId('collapsed-role-links')).not.toBeInTheDocument();
  });
});
