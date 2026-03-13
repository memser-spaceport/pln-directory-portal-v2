import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AiGeneratedTeamProfileBanner } from '@/components/page/team-details/AiGeneratedTeamProfileBanner';
import { useReviewTeamEnrichmentMutation } from '@/services/teams/hooks/useReviewTeamEnrichmentMutation';

jest.mock('@/services/teams/hooks/useReviewTeamEnrichmentMutation', () => ({
  useReviewTeamEnrichmentMutation: jest.fn(),
}));

const mockedUseReviewTeamEnrichmentMutation = useReviewTeamEnrichmentMutation as jest.Mock;

const team = {
  id: 'team-1',
  asks: [],
  maintainingProjects: [],
  contributingProjects: [],
  teamFocusAreas: [],
  dataEnrichment: {
    isAIGenerated: true,
  },
};

describe('AiGeneratedTeamProfileBanner', () => {
  const mutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseReviewTeamEnrichmentMutation.mockReturnValue({
      mutate,
    });
  });

  it('renders the figma banner copy and action', () => {
    render(<AiGeneratedTeamProfileBanner team={team} />);

    expect(screen.getByText(/We've auto-filled parts of your profile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /i have reviewed the profile/i })).toBeInTheDocument();
  });

  it('hides immediately and calls the enrichment review mutation', () => {
    render(<AiGeneratedTeamProfileBanner team={team} />);

    fireEvent.click(screen.getByRole('button', { name: /i have reviewed the profile/i }));

    expect(mutate).toHaveBeenCalledWith({ teamUid: 'team-1' }, expect.objectContaining({ onError: expect.any(Function) }));
    expect(screen.queryByTestId('ai-generated-team-profile-banner')).not.toBeInTheDocument();
  });

  it('restores the banner when the mutation errors', () => {
    mutate.mockImplementation((_variables, options) => {
      options.onError?.(new Error('boom'));
    });

    render(<AiGeneratedTeamProfileBanner team={team} />);

    fireEvent.click(screen.getByRole('button', { name: /i have reviewed the profile/i }));

    expect(screen.getByTestId('ai-generated-team-profile-banner')).toBeInTheDocument();
  });

  it('does not render when the team is already reviewed', () => {
    render(
      <AiGeneratedTeamProfileBanner
        team={{
          ...team,
          dataEnrichment: {
            ...team.dataEnrichment,
            status: 'Reviewed',
          },
        }}
      />,
    );

    expect(screen.queryByTestId('ai-generated-team-profile-banner')).not.toBeInTheDocument();
  });
});