import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  stripFollowerCountFromReason,
  TeamsToFollowCard,
} from '@/components/page/home/TeamNews/components/NewsRail/components/TeamsToFollowCard';
import type { ISuggestedTeam } from '@/types/team-news.types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const team = (partial: Partial<ISuggestedTeam> & Pick<ISuggestedTeam, 'uid'>): ISuggestedTeam => ({
  name: 'Team',
  logo: null,
  reason: 'Storage · 1.2k followers',
  ...partial,
});

describe('stripFollowerCountFromReason', () => {
  it('strips a trailing follower count segment', () => {
    expect(stripFollowerCountFromReason('Storage · 1.2k followers')).toBe('Storage');
    expect(stripFollowerCountFromReason('Infrastructure · 890 followers')).toBe('Infrastructure');
  });

  it('leaves reasons without a follower count unchanged', () => {
    expect(stripFollowerCountFromReason('Storage · shared focus area')).toBe('Storage · shared focus area');
  });
});

describe('TeamsToFollowCard', () => {
  const mockOnFollowToggle = jest.fn();
  const emptyFollowed = new Set<string>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null });
  });

  it('renders nothing when suggestions is empty and not loading', () => {
    const { container } = render(
      <TeamsToFollowCard
        suggestions={[]}
        isLoading={false}
        followedTeamUids={emptyFollowed}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a skeleton while loading', () => {
    render(
      <TeamsToFollowCard
        suggestions={[]}
        isLoading
        followedTeamUids={emptyFollowed}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    expect(screen.getByRole('region', { name: 'Teams to follow' })).toHaveAttribute('aria-busy', 'true');
  });

  it('renders each suggestion with name and reason, without follower counts', () => {
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage', reason: 'Storage · 1.2k followers' })]}
        isLoading={false}
        followedTeamUids={emptyFollowed}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    expect(screen.getByText('Banyan Storage')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.queryByText(/followers/i)).not.toBeInTheDocument();
  });

  it('redirects to login on follow click when anonymous, without calling onFollowToggle', () => {
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage' })]}
        isLoading={false}
        followedTeamUids={emptyFollowed}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /follow banyan storage/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
    expect(mockOnFollowToggle).not.toHaveBeenCalled();
  });

  it('calls onFollowToggle(teamUid, teamName, false, news-rail) when authenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' } });
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage' })]}
        isLoading={false}
        followedTeamUids={emptyFollowed}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /follow banyan storage/i }));
    expect(mockOnFollowToggle).toHaveBeenCalledWith('t1', 'Banyan Storage', false, 'news-rail');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows Following with a checkmark when the team is in followedTeamUids', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' } });
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage' })]}
        isLoading={false}
        followedTeamUids={new Set(['t1'])}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    expect(screen.getByRole('button', { name: /following banyan storage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /following banyan storage/i })).toBeDisabled();
  });
});
