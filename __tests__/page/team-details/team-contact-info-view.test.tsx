import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TeamContactInfoView } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView';
import type { ITeam } from '@/types/teams.types';
import type { IUserInfo } from '@/types/shared.types';

jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({ onTeamDetailContactClicked: jest.fn() }),
}));

const team = {
  id: 'team-1',
  asks: [],
  maintainingProjects: [],
  contributingProjects: [],
  teamFocusAreas: [],
  jobReferEmail: 'jobs@acme.com',
  contactMethod: 'hello@acme.com',
} as ITeam;

const lead: IUserInfo = { uid: 'u1', leadingTeams: ['team-1'] };
const visitor: IUserInfo = { uid: 'u2', leadingTeams: [] };

describe('TeamContactInfoView jobReferEmail', () => {
  it('shows the job referral email to a team lead', () => {
    render(<TeamContactInfoView team={team} userInfo={lead} toggleIsEditMode={jest.fn()} />);

    expect(screen.getByText('Job Referral/Application Contact')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'jobs@acme.com' })).toHaveAttribute('href', 'mailto:jobs@acme.com');
  });

  it('hides the job referral email from visitors who are not leads or admins', () => {
    render(<TeamContactInfoView team={team} userInfo={visitor} toggleIsEditMode={jest.fn()} />);

    expect(screen.queryByText('Job Referral/Application Contact')).not.toBeInTheDocument();
    expect(screen.queryByText('jobs@acme.com')).not.toBeInTheDocument();
  });
});
