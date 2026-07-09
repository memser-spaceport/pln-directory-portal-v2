import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { TeamsToFollowCard } from '@/components/page/home/TeamNews/components/NewsRail/components/TeamsToFollowCard';
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

describe('TeamsToFollowCard', () => {
  const mockOnFollowToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null });
  });

  it('renders nothing when suggestions is empty and not loading', () => {
    const { container } = render(
      <TeamsToFollowCard suggestions={[]} isLoading={false} onFollowToggle={mockOnFollowToggle} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a skeleton while loading', () => {
    render(<TeamsToFollowCard suggestions={[]} isLoading onFollowToggle={mockOnFollowToggle} />);
    expect(screen.getByRole('region', { name: 'Teams to follow' })).toHaveAttribute('aria-busy', 'true');
  });

  it('renders each suggestion with name and reason', () => {
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage', reason: 'Storage · shared focus area' })]}
        isLoading={false}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    expect(screen.getByText('Banyan Storage')).toBeInTheDocument();
    expect(screen.getByText('Storage · shared focus area')).toBeInTheDocument();
  });

  it('redirects to login on follow click when anonymous, without calling onFollowToggle', () => {
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage' })]}
        isLoading={false}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /follow banyan storage/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('#login'));
    expect(mockOnFollowToggle).not.toHaveBeenCalled();
  });

  it('calls onFollowToggle(teamUid, teamName, false) when authenticated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'user-1' } });
    render(
      <TeamsToFollowCard
        suggestions={[team({ uid: 't1', name: 'Banyan Storage' })]}
        isLoading={false}
        onFollowToggle={mockOnFollowToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /follow banyan storage/i }));
    expect(mockOnFollowToggle).toHaveBeenCalledWith('t1', 'Banyan Storage', false);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
