/**
 * LAB-3093: the teams on a project page are links, so a crawler reaches them from the project.
 */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import TeamsInvolved from '@/components/page/project-details/teams-involved';

const analytics = {
  onProjectDetailContributingTeamClicked: jest.fn(),
  onProjectDetailMaintainerTeamClicked: jest.fn(),
  onProjectDetailSeeAllTeamsClicked: jest.fn(),
};
jest.mock('@/analytics/project.analytics', () => ({ useProjectAnalytics: () => analytics }));
jest.mock('@/components/page/project-details/all-teams-modal', () => () => null);

const project = {
  id: 'p1',
  maintainingTeam: { uid: 'team-m', name: 'Maintainer Team' },
  contributingTeams: [{ uid: 'team-c', name: 'Contributor Team' }],
};

describe('TeamsInvolved', () => {
  it('links the maintaining and contributing teams to their profiles, in a new tab', () => {
    window.open = jest.fn();
    render(<TeamsInvolved project={project} user={{} as never} />);

    const maintainer = screen.getByText('Maintainer Team').closest('a');
    const contributor = screen.getByText('Contributor Team').closest('a');
    expect(maintainer).toHaveAttribute('href', '/teams/team-m');
    expect(contributor).toHaveAttribute('href', '/teams/team-c');
    expect(maintainer).toHaveAttribute('target', '_blank');

    fireEvent.click(contributor!);
    expect(analytics.onProjectDetailContributingTeamClicked).toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });
});
