import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags', () => ({
  useGetFocusTags: () => [],
}));

jest.mock('@/components/page/team-news/TeamNewsCountChip', () => ({
  TeamNewsCountChip: () => null,
}));

// The row is stood in for: this suite asserts which rows the CARD hands the
// save wiring to, not the bookmark itself.
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow', () => ({
  ReferRoleRow: ({ save }: { save?: unknown }) => <li data-testid="role-row" data-has-save={save ? 'yes' : 'no'} />,
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => null,
}));

import { TeamGroupCard } from '@/components/page/jobs/TeamGroupCard';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

const ROLE: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Engineer',
  roleCategory: null,
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2020-01-01T00:00:00.000Z',
  postedDate: '2020-01-01T00:00:00.000Z',
  detectionDate: null,
};

const group = (teamUid: string): IJobTeamGroup => ({
  team: {
    uid: teamUid,
    name: 'Acme',
    logoUrl: null,
    focusAreas: [],
    subFocusAreas: [],
    jobReferEmail: null,
  },
  totalRoles: 1,
  roles: [ROLE],
});

const renderCard = (teamUid: string, memberTeamUids: string[]) =>
  render(
    <TeamGroupCard
      group={group(teamUid)}
      onRoleClick={jest.fn()}
      save={{ memberUid: 'm1', savedScope: false, memberTeamUids: new Set(memberTeamUids) }}
    />,
  );

const savedWiring = () => screen.getByTestId('role-row').getAttribute('data-has-save');

describe('TeamGroupCard save slot', () => {
  it('offers the bookmark on another team’s listings', () => {
    renderCard('team-1', ['team-9']);

    expect(savedWiring()).toBe('yes');
  });

  it('withholds it on the viewer’s own team — member or lead, one rule', () => {
    renderCard('team-1', ['team-9', 'team-1']);

    expect(savedWiring()).toBe('no');
  });

  it('renders the card it always had when the host passes no save wiring', () => {
    render(<TeamGroupCard group={group('team-1')} onRoleClick={jest.fn()} />);

    expect(savedWiring()).toBe('no');
  });
});
